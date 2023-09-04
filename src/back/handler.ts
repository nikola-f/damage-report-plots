import { SQSClient, GetQueueAttributesCommand } from "npm:@aws-sdk/client-sqs";


export class Queue {

    private client = new SQSClient({});

    constructor(private url: string){}

    // queue(), dequeue()

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

