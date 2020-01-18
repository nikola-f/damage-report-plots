import {QueryOutput} from 'aws-sdk/clients/dynamodb';
import {CreateQueueRequest} from 'aws-sdk/clients/sqs';
import {Job, JobStatus, Range} from '@common/types';

import * as util from '@common/util';
import * as launcher from '../lib/launcher';
import * as AWS from 'aws-sdk';
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();
const sqs: AWS.SQS = new AWS.SQS();
import * as dateFormat from 'dateformat';



export const done = (job: Job): void => {
  job.status = JobStatus.Done;
  launcher.putJobAsync(job);
};


export const cancel = (job: Job): void => {
  job.status = JobStatus.Cancelled;
  launcher.putJobAsync(job);
};


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
// export const getJobList = async (openId: string): Promise<Job[]> => {
  
//   let jobs: Job[] = [];
//   let qo: QueryOutput;
//   try {
//     qo = await dynamo.query({
//       "TableName": 'job',
//       "ScanIndexForward": false,
//       "KeyConditionExpression": 'openId = :o',
//       "ExpressionAttributeValues": {
//         ":o": openId
//       },
//       "Limit": 10
//     }).promise();
    
//     if(qo.Items) {
//       for(let item of qo.Items as any) {
//         console.log('item:', item);
//         jobs.push({
//           "openId": 'me',
//           "createTime": Number(item.createTime),
//           "status": JobStatus[JobStatus[Number(item.status)]],
//           "lastAccessTime": Number(item.lastAccessTime),
//           "lastReportTime": Number(item.lastReportTime),
//           // "rangeToTime": Number(item.rangeToTime),
//           "thread": {
//             "queueUrl": '',
//             "queuedCount": util.isSet(() => item.thread.queuedCount) ?
//               Number(item.thread.queuedCount) : 0
//           },
//           "report": {
//             "queueUrl": '',
//             "queuedCount": util.isSet(() => item.report.queuedCount) ?
//               Number(item.report.queuedCount) : 0
//           },
//           "accessToken": null,
//           "agent": null
//         });
//       }
//     }

//   }catch(err){
//     console.error('getJobList:', err);
//   }finally{
//     return Promise.resolve(jobs);
//   }

// };


