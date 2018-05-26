import {SNSEvent, Handler, ProxyResult,
  APIGatewayEvent} from 'aws-lambda';
import {QueryOutput} from 'aws-sdk/clients/dynamodb';
import {Job, JobStatus, CreateJobMessage, Session, Agent, QueueThreadsMessage} 
  from '@damage-report-plots/common/types';

const env = require('@damage-report-plots/common/env');

import * as launcher from '@damage-report-plots/common/launcher';
import * as libQueue from './lib/queue';
import * as libTicket from './lib/ticket';
import * as libAuth from './lib/auth';
import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient(),
      JOB_QUEUE_URL = process.env.JOB_QUEUE_URL
;


/**
 * jobの開始
 * @next createAgentQueue
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
      launcher.createAgentQueueAsync(job);
      
      // JobStatusをProcessingに
      job.status = JobStatus.Processing;
      job.lastAccessTime = Date.now();
      launcher.putJobAsync(job);

      // queueからjob削除
      libQueue.deleteMessage(JOB_QUEUE_URL, message);

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

    // token無効化
    libAuth.revokeTokens(
      env.GOOGLE_CALLBACK_URL_JOB,
      job.tokens.jobAccessToken,
      job.tokens.jobRefreshToken
    );
    job.tokens = null;

    // DB保存
    job.status = JobStatus.Done;
    launcher.putJobAsync(job);

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



