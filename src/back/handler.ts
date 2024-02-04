import { SQSClient, GetQueueAttributesCommand, SendMessageBatchCommand,
        SendMessageBatchRequestEntry, ReceiveMessageCommand, DeleteMessageBatchCommand,
        PutItemCommand, DynamoDBClient, DynamoDBDocumentClient, marshall, unmarshall,
        jsonSizeOf, Hashids } from "./deps.ts";
import { Report, Auth, Job } from "./model.ts";


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
                    MessageAttributes: {
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
            return Promise.reject(err);
        }
        return Promise.resolve(length);
    }

};


export class Scheduler {

    private client = new DynamoDBClient({});
    private docClient = DynamoDBDocumentClient.from(this.client);
    // private static readonly hashids = new Hashids('drp email', 0,
    //     'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!#$%&()*+-;<=>?@^_`{|}~'
    // );

    available = async (): Promise<boolean> => {
        // count unprocessed job, ignore queue length

        return await Promise.resolve(true);
    };


    add = async (auth: Auth, start?: Date): Promise<{hashedUserId: string, createdAt: number}> => {
        const createdAt = Date.now();
        const job = new Job(auth, createdAt, null, start);

        const command = new PutItemCommand({
            TableName: "Job",
            Item: marshall({
                hashedUserId: job.getHashedUserId(),
                createdAt: createdAt,
                userId: job.getAuth().userId,
                accessToken: job.getAuth().accessToken,
                start: job.getStart() ? job.getStart().getTime() : null,
            }),
            // Item: {
            //     hashedUserId: job.getHashedUserId(),
            //     createdAt: createdAt,
            //     accessToken: job.getAuth().accessToken,
            //     userId: job.getAuth().userId,
            //     start: job.getStart() ? job.getStart().getTime() : null,
            // },
            ReturnValues: "ALL_NEW"
        });
        try {
            const response = await this.docClient.send(command);
            const putItem = unmarshall(response.Attributes);
            return await Promise.resolve({
                hashedUserId: putItem.hashedUserId,
                createdAt: putItem.createdAt
            });
    
        }catch(err){
            console.error(err);
            return Promise.reject(job.getHashedUserId());
        }
            
    }

};



export class Mailer {

};
