import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {CreateQueueRequest} from 'aws-sdk/clients/sqs';
import {Agent, JobStatus, CreateJobMessage, Job} from ':common/types';

import * as launcher from ':common/launcher';
import * as util from ':common/util';

import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();

const sqs: AWS.SQS = new AWS.SQS();
import * as dateFormat from 'dateformat';

/**
 * agentの保存
 * 全カラム
 * @next -
 */
export const putAgent = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {
    const agent: Agent = JSON.parse(rec.Sns.Message);

    agent.lastAccessTime = Date.now();

    dynamo.put({
      "TableName": "agent",
      "Item": agent
    }).promise()
    .then(() => {
      console.log('done put agent:' + JSON.stringify(agent));
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
 * agent queueの作成
 * @next checkSheetsExistence
 */
export const createAgentQueue = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

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

      launcher.checkSheetsExistenceAsync(job);

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
 * agent queueの削除
 * @next -
 */
export const deleteAgentQueue = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

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
      callback(err, null);
      return Promise.reject(err);
    }
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


