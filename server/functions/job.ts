import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {GetQueueAttributesRequest, QueueAttributeName,
  GetQueueAttributesResult, SendMessageBatchRequest,
  ReceiveMessageRequest, ReceiveMessageResult,
  DeleteMessageBatchRequest, DeleteMessageBatchResult,
  CreateQueueRequest, DeleteQueueRequest} from 'aws-sdk/clients/sqs';
import {Job, JobStatus, CreateJobMessage} from './types';

import AWS = require('aws-sdk');
import lc = require('./common/launcher');
import qu = require('./common/queue');
import au = require('./common/auth');
import ti = require('./common/ticket_');
import ut = require('./common/util');
const sqs: AWS.SQS = new AWS.SQS(),
      dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient(),
      REDIRECT_URL: string = 'https://plots.run/redirect',
      JOB_QUEUE_URL = process.env.JOB_QUEUE_URL
;


export async function createJob(event: SNSEvent, context, callback): Promise<void> {
  // console.log(JSON.stringify(event));

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

    console.log(`try to create job: from ${ut.toString(job.rangeFromTime)} to ${ut.toString(job.rangeToTime)}`);
    lc.createAgentQueueAsync(job);
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


export async function startJob(event, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  // ticket残高チェック
  if(await ti.hasAvailable()) {

    // queueからjob取得
    const message = await qu.receiveMessage(JOB_QUEUE_URL);
    if(message) {
      // queueThreads起動
      const job: Job = JSON.parse(message.Body);
      lc.queueThreadsAsync({
        "job": job
      });

    }else{
      console.log('JobQueue is empty.');
    }
  }else{
    console.log('No tickets available.');
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


export async function finalizeJob(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    // agentQueue削除
    lc.deleteAgentQueueAsync(job);

    // ticket消費
    const tickets = ti.computeAmount(job);
    lc.consumeTicketsAsync(tickets);

    // 保存
    job.lastAccessTime = Date.now();
    job.status = JobStatus.Done;
    job.tokens = null;
    lc.putJobAsync(job);

    // tokenの無効化はauthorizer
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


export async function queueJob(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    job.lastAccessTime = Date.now();
    qu.sendMessage(JOB_QUEUE_URL, {
      "MessageId": '0',
      "Body": JSON.stringify(job)
    });

    lc.putJobAsync(job);
    //jobのpopからのqueueThreadsの起動は別関数(startJob)とする
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



export async function deleteAgentQueue(event: SNSEvent, context, callback): Promise<void> {
  console.log('event:' + JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    try {
      sqs.deleteQueue({
        QueueUrl: job.thread.queueUrl
      }).promise();
      sqs.deleteQueue({
        QueueUrl: job.mail.queueUrl
      }).promise();
      sqs.deleteQueue({
        QueueUrl: job.report.queueUrl
      }).promise();
      console.log('queues deleted:' + JSON.stringify(job));
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


export async function createAgentQueue(event: SNSEvent, context, callback): Promise<void> {
  console.log('event:' + JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    try {
      let createQueueParams: CreateQueueRequest = {
        "QueueName": String(job.createTime) + '_thread_' + job.agent.hashedId + '.fifo',
        "Attributes": {
          "FifoQueue": 'true',
          "ContentBasedDeduplication": 'false'
        }
      };
      const threadQueueRes = await sqs.createQueue(createQueueParams).promise();
      job.thread = {
        queueUrl: threadQueueRes.QueueUrl,
        queuedCount: 0,
        dequeuedCount: 0
      };

      createQueueParams = {
        "QueueName": String(job.createTime) + '_mail_' + job.agent.hashedId + '.fifo',
        "Attributes": {
          "FifoQueue": 'true',
          "ContentBasedDeduplication": 'false'
        }
      };
      const mailQueueRes = await sqs.createQueue(createQueueParams).promise();
      job.mail = {
        queueUrl: mailQueueRes.QueueUrl,
        queuedCount: 0,
        dequeuedCount: 0
      };

      createQueueParams = {
        "QueueName": String(job.createTime) + '_report_' + job.agent.hashedId + '.fifo',
        "Attributes": {
          "FifoQueue": 'true',
          "ContentBasedDeduplication": 'false'
        }
      };
      const reportQueueRes = await sqs.createQueue(createQueueParams).promise();
      job.report = {
        queueUrl: reportQueueRes.QueueUrl,
        queuedCount: 0,
        dequeuedCount: 0
      };

      job.lastAccessTime = Date.now();
      console.log('queues created:' + JSON.stringify(job));

      lc.queueJobAsync(job);

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
