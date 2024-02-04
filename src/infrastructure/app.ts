import { App, Stack, StackProps, Duration } from 'npm:aws-cdk-lib@2.121.1/core';
import { Queue } from 'npm:aws-cdk-lib@2.121.1/aws-sqs';
import { Table, AttributeType, BillingMode } from 'npm:aws-cdk-lib@2.121.1/aws-dynamodb'
import { Construct } from 'npm:constructs';


export class DefaultStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);


        const reportDeadLetterQueue = new Queue(this, 'ReportDeadLetter.fifo', {
            fifo: true,
            retentionPeriod: Duration.days(14),
        });
        new Queue(this, 'Report.fifo', {
            fifo: true,
            visibilityTimeout: Duration.seconds(60),
            retentionPeriod: Duration.hours(1),
            deadLetterQueue: {
                queue: reportDeadLetterQueue,
                maxReceiveCount: 2
            }
        });

        const jobTable = new Table(this, 'Job', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'hashedUserId',
                type: AttributeType.STRING
            },
            sortKey: {
                name: 'createdAt',
                type: AttributeType.NUMBER
            }
        });
        jobTable.addLocalSecondaryIndex({
            indexName: 'userId',
            sortKey: {
                name: 'userId',
                type: AttributeType.STRING
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
