import { SQSClient, GetQueueAttributesCommand, SendMessageBatchCommand,
        SendMessageBatchRequestEntry, ReceiveMessageCommand, DeleteMessageBatchCommand,
        jsonSizeOf } from "./deps.ts";
import { Report, Auth } from "./model.ts";


export class Queue {

    private client = new SQSClient({});

    private static readonly DEFAULT_MAX_MESSAGE_SIZE = 252 * 1024; // 4KiB reserved

    constructor(private url: string){}


    receive = async (): Promise<{messages: Array<Report>, done: {(): Promise<{successful: number, failed: number}>}}> => {

        const messages: Array<Report> = [];
        const handles: Array<string> = [];
        while(messages.length < 1000) {
            try {
                const response = await this.client.send(new ReceiveMessageCommand({
                    QueueUrl: this.url,
                    MaxNumberOfMessages: 10,
                    WaitTimeSeconds: 20
                }));
                if(response?.Messages) {
                    response.Messages.map((message) => {
                        Report.parse(message.Body).map((report) => {
                            messages.push(report);
                        });
                        handles.push(message.ReceiptHandle);
                    });
                }else{
                    break;
                }
            }catch(err){
                console.error(err);
                break;
            }
    
        }

        const done = async (): Promise<{successful: number, failed: number}> => {
            let successful = 0, failed = 0;
            for(let i = 0; i < handles.length; i += 10) {
                const chunk = handles.slice(i, i+10);
                const command = new DeleteMessageBatchCommand({
                    QueueUrl: this.url,
                    Entries: chunk.map((handle, index) => ({
                        Id: String(index),
                        ReceiptHandle: handle
                    }))
                });
                try {
                    const response = await this.client.send(command);
                    successful += response?.Successful?.length? response.Successful.length : 0;
                    failed += response?.Failed?.length? response.Failed.length : 0;
                 }catch(err){
                    console.error(err);
                }
            }
            return Promise.resolve({
                successful: successful,
                failed: failed
            });
        }

        return Promise.resolve({messages: messages, done: done});
    }


    send = async (messages: Array<Report>, auth: Auth): Promise<{
                        successful: number, failed: number, message: number, batch: number
                    }> => {

        const messageBatchArray = this.packetize(messages, auth);
        let successful = 0, failed = 0, message = 0, batch = 0;

        for(const aMessageBatch of messageBatchArray) {
            const command = new SendMessageBatchCommand({
                QueueUrl: this.url, 
                Entries: aMessageBatch
            });

            let response = null;
            batch++;
            message += aMessageBatch.length;
            try {
                response = await this.client.send(command);
                successful += response?.Successful?.length? response.Successful.length : 0;
                failed += response?.Failed?.length? response.Failed.length : 0;
    
            }catch(err){
                if(response?.Failed) {
                    failed += response.Failed.length;
                }
                console.error(err);
                response = null;
                continue;
            }
        }

        return Promise.resolve({successful, failed, message, batch});
    };


    private splitBySize = (splitArray: Array<Array<Array<string | number>>>, dumpedReportArray: Array<Array<string | number>>, maxSize: number): void => {

        if(jsonSizeOf(dumpedReportArray) <= maxSize) {
            splitArray.push(dumpedReportArray);

        }else{
            const half = (dumpedReportArray.length +1) / 2;
            this.splitBySize(splitArray, dumpedReportArray.slice(0, half), maxSize);
            this.splitBySize(splitArray, dumpedReportArray.slice(half), maxSize);
        }
    };


    private packetize = (messages: Array<Report>, auth: Auth, maxSize?: number): Array<Array<SendMessageBatchRequestEntry>> => {

        const actualMaxSize = maxSize? maxSize : Queue.DEFAULT_MAX_MESSAGE_SIZE;
        const dumpedReportArray = messages.map((report) => report.dump());

        const result: Array<Array<SendMessageBatchRequestEntry>> = [];
        const splitArray: Array<Array<Array<string | number>>> = [];
        this.splitBySize(splitArray, dumpedReportArray, actualMaxSize);
        for (let i = 0; i < splitArray.length; i += 10) {
            const chunk = splitArray.slice(i, i + 10);

            const entryArray: Array<SendMessageBatchRequestEntry> = chunk.map((split, index) => {
                return {
                    Id: String(index),
                    MessageBody: JSON.stringify(split),
                    MessageGroupId: auth.userId.replaceAll("@", "&"), // group id doesn't accept @
                    MessageSystemAttributes: {
                        'accessToken': {
                            DataType: 'String',
                            StringValue: auth.accessToken
                        },
                        'userId': {
                            DataType: 'String',
                            StringValue: auth.userId
                        },
                    }
                }
            });
            result.push(entryArray);
        }

        return result;
    };


    length = async (): Promise<number> => {

        let length = 0;
        try {
            const response = await this.client.send(new GetQueueAttributesCommand({
                QueueUrl: this.url,
                AttributeNames: ["ApproximateNumberOfMessages"]
            }));
    
            if(response?.Attributes?.ApproximateNumberOfMessages) {
                length = Number(response.Attributes.ApproximateNumberOfMessages);
            }else{
                length = NaN;
            }

        } catch(err) {
            console.error(err);
        }
        return Promise.resolve(length);
    }

}

