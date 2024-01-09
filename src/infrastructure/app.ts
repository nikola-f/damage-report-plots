import { App, Stack, StackProps, Duration } from 'npm:aws-cdk-lib/core';
import { Queue } from 'npm:aws-cdk-lib/aws-sqs';
import { Construct } from 'npm:constructs';


export class DefaultStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);


        const reportDeadLetterQueue = new Queue(this, 'ReportDeadLetterQueue.fifo', {
            fifo: true,
            retentionPeriod: Duration.days(14),
        });
        const reportQueue = new Queue(this, 'ReportQueue.fifo', {
            fifo: true,
            visibilityTimeout: Duration.seconds(60),
            retentionPeriod: Duration.hours(1),
            deadLetterQueue: {
                queue: reportDeadLetterQueue,
                maxReceiveCount: 2
            }
        });

        // // Create an S3 bucket
        // const bucket = new s3.Bucket(this, 'MyBucket', {
        //     removalPolicy: cdk.RemovalPolicy.DESTROY,
        // });

        // // Create a Lambda function
        // const lambdaFunction = new lambda.Function(this, 'MyLambda', {
        //     runtime: lambda.Runtime.NODEJS_14_X,
        //     code: lambda.Code.fromAsset('lambda'),
        //     handler: 'index.handler',
        // });

        // // Grant the Lambda function read/write access to the S3 bucket
        // bucket.grantReadWrite(lambdaFunction);
    }
}

const app = new App();
new DefaultStack(app, 'drpDefaultStack');
