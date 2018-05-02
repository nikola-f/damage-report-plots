import {SNSEvent, Handler, ProxyResult,
  APIGatewayEvent} from 'aws-lambda';
import {GetQueueAttributesRequest, QueueAttributeName,
  GetQueueAttributesResult, SendMessageBatchRequest,
  ReceiveMessageRequest, ReceiveMessageResult,
  DeleteMessageBatchRequest, DeleteMessageBatchResult,
  CreateQueueRequest, DeleteQueueRequest} from 'aws-sdk/clients/sqs';
import {QueryOutput} from 'aws-sdk/clients/dynamodb';
import {Job, JobStatus, CreateJobMessage, Session, Agent} 
  from '@damage-report-plots/common/types';

import * as launcher from '@damage-report-plots/common/launcher';
import * as libQueue from './lib/queue';
import * as libTicket from './lib/ticket';
import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const sqs: AWS.SQS = new AWS.SQS(),
      dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient(),
      JOB_QUEUE_URL = process.env.JOB_QUEUE_URL
;


/**
 * jobの一覧を返す
 * @next -
 */
// export async function listJob(event: APIGatewayEvent, context, callback): Promise<void> {
// };


/**
 * jobの作成
 * @next createAgentQueue
 */
export async function createJob(event: APIGatewayEvent, context, callback): Promise<void> {
  // console.log(JSON.stringify(event));

  // try {
  //   const cjm: CreateJobMessage = JSON.parse(event.body);

  //   // session読み込み, 検証
  //   const session: Session = await se.getSession(event.headers.Cookie, cjm.stateToken);
  //   if(!session || !await jo.checkCreateJobMessage(cjm, session.openId)) {
  //     throw new Error('check ng');
  //   }
    
  //   // agent読み込み
  //   const agent: Agent = await ag.getAgent(session.openId);

  //   const job: Job = {
  //     "agent": agent,
  //     "createTime": Date.now(),
  //     "lastAccessTime": Date.now(),
  //     "rangeFromTime": cjm.rangeFromTime,
  //     "rangeToTime": cjm.rangeToTime,
  //     "tokens": session.tokens,
  //     "status": JobStatus.Created,
  //   };
  
  //   console.log(`try to create job: from ${ut.toString(job.rangeFromTime)} to ${ut.toString(job.rangeToTime)}`);
  //   lc.createAgentQueueAsync(job);

  //   callback(null, {
  //     "statusCode": 200,
  //     "body": {}
  //   });

  // }catch(err){
  //   console.log(JSON.stringify(err));
  //   callback(null, {
  //     "statusCode": 400,
  //     "body": 'System running hot!'
  //   });
  // }

};


/**
 * jobの開始
 * @next queueThreads
 */
export const startJob = async (event, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  // ticket残高チェック
  if(await libTicket.hasAvailable()) {

    // queueからjob取得
    const message = await libQueue.receiveMessage(JOB_QUEUE_URL);
    if(message) {
      // queueThreads起動
      const job: Job = JSON.parse(message.Body);
      launcher.queueThreadsAsync({
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


/**
 * jobの終了
 * @next deleteAgentQueue, consumeTicket, putJob
 */
export const finalizeJob = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    // agentQueue削除
    launcher.deleteAgentQueueAsync(job);

    // ticket消費
    const tickets = libTicket.computeAmount(job);
    launcher.consumeTicketsAsync(tickets);

    // 保存
    job.lastAccessTime = Date.now();
    job.status = JobStatus.Done;
    job.tokens = null;
    launcher.putJobAsync(job);

    // tokenの無効化はauthorizer
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


/**
 * jobのキューイング
 * @next putJob
 */
export const queueJob = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    job.lastAccessTime = Date.now();
    libQueue.sendMessage(JOB_QUEUE_URL, {
      "MessageId": '0',
      "Body": JSON.stringify(job)
    });

    launcher.putJobAsync(job);
    //jobのpopからのqueueThreadsの起動はstartJobで
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


/**
 * jobのdb保存
 * @next -
 */
export const putJob = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    job.lastAccessTime = Date.now();

    //FIXME データ構造違い
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


/**
 * agent queueの削除
 * @next -
 */
export const deleteAgentQueue = async (event: SNSEvent, context, callback): Promise<void> => {
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


/**
 * agent queueの作成
 * @next queueJob
 */
export const createAgentQueue = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log('event:' + JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    try {
      let createQueueParams: CreateQueueRequest = {
        "QueueName": String(job.createTime) + '_thread_' + job.openId + '.fifo',
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
        "QueueName": String(job.createTime) + '_mail_' + job.openId + '.fifo',
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
        "QueueName": String(job.createTime) + '_report_' + job.openId + '.fifo',
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

      launcher.queueJobAsync(job);

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
