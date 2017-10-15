import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {GetQueueAttributesRequest, QueueAttributeName,
  GetQueueAttributesResult, SendMessageBatchRequest,
  ReceiveMessageRequest, ReceiveMessageResult,
  DeleteMessageBatchRequest, DeleteMessageBatchResult,
  CreateQueueRequest} from 'aws-sdk/clients/sqs';
import {PublishInput} from 'aws-sdk/clients/sns';
import {Job, JobStatus, CreateJobMessage} from './types';

import AWS = require('aws-sdk');
import lc = require('./common/launcher');
const sqs: AWS.SQS = new AWS.SQS(),
      sns: AWS.SNS = new AWS.SNS(),
      dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient()
;


export async function createJob(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const cjm: CreateJobMessage = JSON.parse(rec.Sns.Message);

    const job: Job = {
      "agent": cjm.agent,
      "createTime": Date.now(),
      "lastAccessTime": Date.now(),
      "rangeFromTime": cjm.rangeFromTime,
      "rangeToTime": cjm.rangeToTime,
      "tokens": cjm.tokens,
      "status": JobStatus.Created,
    };
    lc.createAgentQueueAsync(job);
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


export async function putJob(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    job.lastAccessTime = Date.now();

    dynamo.put({
      "TableName": "job",
      "Item": job
    }).promise()
    .then(() => {
      console.log('put job:' + JSON.stringify(job));
    })
    .catch(err => {
      console.error(err);
      callback(err, null);
      return;
    });
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


export async function createAgentQueue(event: SNSEvent, context, callback): Promise<void> {
  console.log('event:' + JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    try {
      let createQueueParams: CreateQueueRequest = {
        QueueName: String(job.createTime) + '_thread_' + job.agent.hashedId
      };
      const threadQueueRes = await sqs.createQueue(createQueueParams).promise();
      job.thread = {
        queueUrl: threadQueueRes.QueueUrl,
        queuedCount: 0,
        dequeuedCount: 0
      };

      createQueueParams = {
        QueueName: String(job.createTime) + '_mail_' + job.agent.hashedId
      };
      const mailQueueRes = await sqs.createQueue(createQueueParams).promise();
      job.mail = {
        queueUrl: mailQueueRes.QueueUrl,
        queuedCount: 0,
        dequeuedCount: 0
      };

      createQueueParams = {
        QueueName: String(job.createTime) + '_report_' + job.agent.hashedId
      };
      const reportQueueRes = await sqs.createQueue(createQueueParams).promise();
      job.report = {
        queueUrl: reportQueueRes.QueueUrl,
        queuedCount: 0,
        dequeuedCount: 0
      };

      job.lastAccessTime = Date.now();
      console.log('created:' + JSON.stringify(job));

      lc.putJobAsync(job);

      //TODO
      //jobキューイング
      //jobのpopからのqueueThreadsの起動は別関数とする

    }catch(err){
      console.error(err);
      callback(err, null);
      return Promise.reject(err);
    }
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};
