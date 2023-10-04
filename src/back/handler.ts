import { SQSClient, GetQueueAttributesCommand, SendMessageBatchCommand,
        SendMessageBatchRequestEntry, jsonSizeOf } from "./deps.ts";
import { Report, Auth } from "./model.ts";


export class Queue {

    private client = new SQSClient({});

    private static readonly MAX_MESSAGE_SIZE = 255 * 1024; // 1KiB reserved

    constructor(private url: string){}

    send = async (messages: Array<Report>, auth: Auth): Promise<{successful: number, failed: number, batch: number}> => {

        const messageBatchArray = this.packetize(messages, auth);
        let successful = 0, failed = 0, batch = 0;

        for(const aMessageBatch of messageBatchArray) {
            const command = new SendMessageBatchCommand({
                QueueUrl: this.url, 
                Entries: aMessageBatch
            });

            let response = null;
            batch++;
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

        return Promise.resolve({successful, failed, batch});
    };

    private mapBodyBySize = (messages: Array<Report>): Array<string> => {

        const bodyArray: Array<string> = [];
        let rawArray: Array<Report> = [];
        let i = 0;
        do {
            rawArray.push(messages[i]);
            if(jsonSizeOf(rawArray) > Queue.MAX_MESSAGE_SIZE) {
                rawArray.pop();
                bodyArray.push(JSON.stringify(rawArray));
                rawArray = [];
            }else{
                i++;
            }

            if(messages.length > i) { // last
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
                    Id: String(index), // just unique number
                    MessageBody: body,
                    MessageGroupId: auth.userId
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

