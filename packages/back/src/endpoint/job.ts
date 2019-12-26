import {SNSEvent, APIGatewayProxyEvent} from 'aws-lambda';
import {Job, JobStatus, CreateJobRequest} from '@common/types';

const env = require(':common/env');

import * as libTicket from '../lib/ticket';
import * as libAgent from '../lib/agent';
import * as launcher from '@common/launcher';
import * as libAuth from '@common/auth';
import * as util from '@common/util';
import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();
;


/**
 * create job and go
 * @next preExecuteJob, putJob
 */
export const createJob = async (event: APIGatewayProxyEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));
  
  const req: CreateJobRequest = JSON.parse(event.body);

  // validate jwt
  let payload;
  try {
    payload = await libAuth.verifyIdToken(req.jwt);
  }catch(err){
    console.error(err);
    callback(null, {
      "statusCode": 400,
      "headers": {
        "Access-Control-Allow-Origin": env.CLIENT_ORIGIN
      },
      "body": 'bad request'
    });
    return;
  }

  // get agent
  const openId = payload['sub'];
  let agent = await libAgent.getAgent(openId);

  // instantiate job
  const createTime = Date.now();
  const job: Job = {
    "openId": openId,
    "createTime": createTime,
    
    "status": JobStatus.Created,
    "lastAccessTime": createTime,
    "tokens": {
      "jobAccessToken": req.accessToken
    },
    "agent": agent
  }

  // save job  
  launcher.putJobAsync(job);

  // call preExecuteJob
  launcher.preExecuteJobAsync(job);

  // // queueからjob取得
  // const message = await libQueue.receiveMessage(JOB_QUEUE_URL);
  // if(message) {
  //   const job: Job = JSON.parse(message.Body);

  //   // JobStatusをProcessingに
  //   job.status = JobStatus.Processing;
  //   job.lastAccessTime = Date.now();
  //   launcher.putJobAsync(job);

  //   // createAgentQueueから起動
  //   launcher.createAgentQueueAsync(job);
    
  //   // queueからjob削除
  //   libQueue.deleteMessage(JOB_QUEUE_URL, message);

  // }else{
  //   console.info('JobQueue is empty.');
  // }

  callback(null, {
    "statusCode": 200,
    "body": {
      "createTime": createTime
    }
  });
};


/**
 * jobの終了
 * @next deleteAgentQueue, consumeTicket, putJob
 */
export const finalizeJob = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);

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
// export const queueJob = async (event: SNSEvent, context, callback): Promise<void> => {
//   console.log(JSON.stringify(event));

//   for(let rec of event.Records) {
//     const job: Job = JSON.parse(rec.Sns.Message);

//     job.lastAccessTime = Date.now();
//     libQueue.sendMessage(JOB_QUEUE_URL, {
//       "MessageId": '0',
//       "Body": JSON.stringify(job)
//     });

//     launcher.putJobAsync(job);
//   }

//   callback(null, {
//     "statusCode": 200,
//     "body": {}
//   });
// };


/**
 * jobのdb保存
 * @next -
 */
export const putJob = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);
  

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    job.lastAccessTime = Date.now();
    // token,agentは保存しない
    job.tokens = null;
    job.agent = null;

    dynamo.put({
      "TableName": "job",
      "Item": job
    }).promise()
    .then(() => {
      console.info('put job:', job);
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



