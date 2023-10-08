import { SQSClient, GetQueueAttributesCommand, SendMessageBatchCommand,
        SendMessageBatchRequestEntry, ReceiveMessageCommand, DeleteMessageBatchCommand,
        jsonSizeOf } from "./deps.ts";
import { Report, Auth } from "./model.ts";


export class Queue {

    private client = new SQSClient({});

    private static readonly MAX_MESSAGE_SIZE = 255 * 1024; // 1KiB reserved

    constructor(private url: string){}


    receive = async (): Promise<{messages: Array<Report>, done: {(): void}}> => {

        const messages: Array<Report> = [];
        const handles: Array<string> = [];
        while(messages.length < 10000) {
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
                    // const done = async (success: boolean) => {
                    //     if(success) {
                    //         await this.client.send(new DeleteMessageCommand({
                    //             QueueUrl: this.url,
                    //             ReceiptHandle: response.Messages[0].ReceiptHandle
                    //         }));
                    //     }
                    // }
                }else{
                    break;
                }
            }catch(err){
                console.error(err);
                break;
            }
    
        }

        return Promise.resolve({messages: messages, done: async () => {
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
                    await this.client.send(command);
                }catch(err){
                    console.error(err);
                }
            }
            //             const command = new DeleteMessageBatchCommand({
            //     QueueUrl: this.url, 
            //     Entries: handles.map((handle, index) => {
            //         return {
            //             Id: String(index),
            //             ReceiptHandle: handle
            //         }
            //     })
            // });
            // try {
            //     await this.client.send(command);
            // }catch(err){
            //     console.error(err);
            // }
        }});
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

    private mapBodyBySize = (messages: Array<Report>): Array<string> => {

        const bodyArray: Array<string> = [];
        let rawArray: Array<Array<string | number>> = [];
        let i = 0;
        do {
            rawArray.push(messages[i].dump());
            if(rawArray.length>2500 && jsonSizeOf(rawArray) > Queue.MAX_MESSAGE_SIZE) { // 2500 is just a guess, enough less than MAX
                rawArray.pop();
                bodyArray.push(JSON.stringify(rawArray));
                rawArray = [];
            }else{
                i++;
            }

            if(messages.length <= i) { // last
                bodyArray.push(JSON.stringify(rawArray));
            }
        } while (messages.length > i);

        return bodyArray;
    }


    private packetize = (messages: Array<Report>, auth: Auth): Array<Array<SendMessageBatchRequestEntry>> => {

        const result: Array<Array<SendMessageBatchRequestEntry>> = [];
        const bodyArray = this.mapBodyBySize(messages);
        for (let i = 0; i < bodyArray.length; i += 10) {
            const chunk = bodyArray.slice(i, i + 10);

            const entryArray: Array<SendMessageBatchRequestEntry> = chunk.map((body, index) => {
                return {
                    Id: String(index),
                    MessageBody: body,
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

