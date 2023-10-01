import { SQSClient, GetQueueAttributesCommand, SendMessageBatchCommand,
    SendMessageBatchRequestEntry } from "npm:@aws-sdk/client-sqs";
import { Report, Auth } from "./model.ts";


export class Queue {

    private client = new SQSClient({});

    private static readonly MAX_MESSAGE_SIZE = 255 * 1024; // 1KiB reserved

    constructor(private url: string){}

    // queue(), dequeue()
    queue = async (messages: Array<Report>, auth: Auth): Promise<{successful: number, failed: number}> => {

        const messageBatchArray = this.packetize(messages, auth);
        let successful = 0, failed = 0;

        for(const aMessageBatch of messageBatchArray) {
            const command = new SendMessageBatchCommand({
                QueueUrl: this.url, 
                Entries: aMessageBatch
            });

            let response = null;
            try {
                response = await this.client.send(command);
                successful += response.Successful.length;
                failed += response.Failed.length;
    
            }catch(err){
                if(response?.Failed) {
                    failed += response.Failed.length;
                }
                console.error(err);
                continue;
            }
        }

        return Promise.resolve({successful, failed});
    };

    /**
     * divide messages into array, max size 255KiB
     * @param messages 
     * @param auth 
     * @returns 
     */
    private packetize = (messages: Array<Report>, auth: Auth): Array<Array<SendMessageBatchRequestEntry>> => {
        


        return [];
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

