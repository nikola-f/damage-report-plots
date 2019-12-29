import {QueryOutput} from 'aws-sdk/clients/dynamodb';
import {CreateQueueRequest} from 'aws-sdk/clients/sqs';
import {Job, JobStatus, Range} from '@common/types';

import * as util from '@common/util';
import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();
const sqs: AWS.SQS = new AWS.SQS();
import * as dateFormat from 'dateformat';





/**
 * delete job queue (for an agent, one job)
 */
export const deleteJobQueue = async (job: Job): Promise<void> => {
  try {
    const threadQueueRes = await sqs.deleteQueue({
      QueueUrl: job.thread.queueUrl
    }).promise();
    const reportQueueRes = await sqs.deleteQueue({
      QueueUrl: job.report.queueUrl
    }).promise();
    console.log('queues deleted:', threadQueueRes, reportQueueRes);
  }catch(err){
    console.error(err);
    throw err;
  }
};


/**
 * create job queue (for an agent, one job)
 */
export const createJobQueue = async (job: Job): Promise<Job> => {

  const formattedCreateTime: string = dateFormat(new Date(job.createTime), 'yyyymmdd_hhMMssl');
  try {
    let createQueueParams: CreateQueueRequest = {
      "QueueName": formattedCreateTime + '_thread_' + job.openId + '.fifo',
      "Attributes": {
        "FifoQueue": 'true',
        "ContentBasedDeduplication": 'true'
      }
    };
    const threadQueueRes = await sqs.createQueue(createQueueParams).promise();
    job.thread = {
      queueUrl: threadQueueRes.QueueUrl,
      queuedCount: 0
    };

    createQueueParams = {
      "QueueName": formattedCreateTime + '_report_' + job.openId + '.fifo',
      "Attributes": {
        "FifoQueue": 'true',
        "ContentBasedDeduplication": 'true'
      }
    };
    const reportQueueRes = await sqs.createQueue(createQueueParams).promise();
    job.report = {
      queueUrl: reportQueueRes.QueueUrl,
      queuedCount: 0
    };

    job.lastAccessTime = Date.now();
    console.log('queues created:', threadQueueRes.QueueUrl, reportQueueRes.QueueUrl);

  }catch(err){
    console.error(err);
    throw err;
  }

  return job;
};





// jobテーブルから降順で10件取得
export const getJobList = async (openId: string): Promise<Job[]> => {
  
  let jobs: Job[] = [];
  let qo: QueryOutput;
  try {
    qo = await dynamo.query({
      "TableName": 'job',
      "ScanIndexForward": false,
      "KeyConditionExpression": 'openId = :o',
      "ExpressionAttributeValues": {
        ":o": openId
      },
      "Limit": 10
    }).promise();
    
    if(qo.Items) {
      for(let item of qo.Items as any) {
        console.log('item:', item);
        jobs.push({
          "openId": 'me',
          "createTime": Number(item.createTime),
          "status": JobStatus[JobStatus[Number(item.status)]],
          "lastAccessTime": Number(item.lastAccessTime),
          "lastReportTime": Number(item.lastReportTime),
          // "rangeToTime": Number(item.rangeToTime),
          "thread": {
            "queueUrl": '',
            "queuedCount": util.isSet(() => item.thread.queuedCount) ?
              Number(item.thread.queuedCount) : 0
          },
          "report": {
            "queueUrl": '',
            "queuedCount": util.isSet(() => item.report.queuedCount) ?
              Number(item.report.queuedCount) : 0
          },
          "accessToken": null,
          "agent": null
        });
      }
    }

  }catch(err){
    console.error('getJobList:', err);
  }finally{
    return Promise.resolve(jobs);
  }

};


// job作成メッセージの内容チェック
// export const validateCreateMessage = async (message: any, user: Session): Promise<boolean> => {

//   console.log('validateCreateMessage:', {
//     "message": message,
//     "user": user
//   });
//   let result: boolean = false;


//   try {

//     // rangeが未定義ならNG
//     if(!util.isSet(() => message.rangeFromTime) ||
//       !util.isSet(() => message.rangeToTime)) {
//       throw new Error('create message/:undefined range');
//     };
    
//     const rangeFromTime: number = Number(message.rangeFromTime);
//     const rangeToTime  : number = Number(message.rangeToTime);

//     // rangeFromTimeがサービス開始前ならNG
//     if(rangeFromTime < INGRESS_EPOCH) {
//       throw new Error(`create message/invalid rangeFromTime:${rangeFromTime}`);
//     }

//     // rangeが0-90日でないならNG
//     const range: number = rangeToTime - rangeFromTime;
//     if(range < 0 ||
//       range > 1000*60*60*24*90) {
//       throw new Error(`create message/invalid range:${range}`);
//     }
    
//     // job実行に必要なtokenがないならNG
//     if(!user.tokens.jobAccessToken || !user.tokens.jobRefreshToken) {
//       throw new Error('create message/invalid token');
//     }

//     // 同agentの未完了のjobが存在するならNG
//     const jobRes: QueryOutput = await dynamo.query({
//       "TableName": 'job',
//       "KeyConditionExpression": 'openId = :o',
//       "FilterExpression": '#st IN (:s0, :s1)',
//       "ExpressionAttributeNames": {
//         "#st": 'status'
//       },
//       "ExpressionAttributeValues": {
//         ":o": user.openId,
//         ":s0": JobStatus.Created,
//         ":s1": JobStatus.Processing
//       }
//     }).promise();
//     if(jobRes.Items && jobRes.Items.length > 0) {
//       throw new Error(`create message/already exists:${JSON.stringify(jobRes.Items)}`);
//     }
    
//     result = true;

//   }catch(err){
//     console.log(err);
//   }finally{
//     return Promise.resolve(result);
//   }
  

// };
