import {SNSEvent, APIGatewayProxyEvent} from 'aws-lambda';
import {CreateQueueRequest} from 'aws-sdk/clients/sqs';
import {Agent, JobStatus, CreateJobMessage, Job} from ':common/types';

import * as launcher from ':common/launcher';
import * as util from ':common/util';
import * as env from ':common/env';
import * as libAgent from ':common/agent';
import * as libAuth from ':common/auth';

import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();

const sqs: AWS.SQS = new AWS.SQS();
import * as dateFormat from 'dateformat';



/**
 * agentの登録
 * @next -
 */
export const signup = async (event: APIGatewayProxyEvent, context, callback): Promise<void> => {
  util.validateProxyEvent(event, callback);

  // token検証  
  let payload;
  try {
    payload = await libAuth.verifyIdToken(event.body);
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


  // dbからagent取得
  const openId = payload['sub'];
  let agent = await libAgent.getAgent(openId);

  let statusCode: number;
  let body: string = null;

  // なければ作成
  if(!agent || Object.keys(agent).length === 0) {
    launcher.putAgentAsync({
      "openId": openId,
      "createTime": Date.now(),
      "lastAccessTime": Date.now()
    });
    statusCode = 200;
    body = JSON.stringify({
      "name": payload['name'],
      "picture": payload['picture'],
      "locale": payload['locale']
    });


  // あれば400
  }else{
    statusCode = 400;
    body = 'bad request';
    console.error('agent already exists.');
  }

  callback(null, {
    "statusCode": statusCode,
    "headers": {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN
    },
    "body": body
  });

};


/**
 * agentのログイン
 * @next -
 */
export const signin = async (event: APIGatewayProxyEvent, context, callback): Promise<void> => {
  util.validateProxyEvent(event, callback);

  // token検証  
  let payload;
  try {
    payload = await libAuth.verifyIdToken(event.body);
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


  // dbからagent取得
  const openId = payload['sub'];
  let agent = await libAgent.getAgent(openId);

  let statusCode: number;
  let body: string = null;

  // なければ204
  if(!agent || Object.keys(agent).length === 0) {
    statusCode = 204;

  // あれば200  
  }else{
    statusCode = 200;
    const spreadsheetId = agent && agent.spreadsheetId ? agent.spreadsheetId : null;
    body = JSON.stringify({
      "spreadsheetId": spreadsheetId,
      "name": payload['name'],
      "picture": payload['picture'],
      "locale": payload['locale']
    });
  }
  callback(null, {
    "statusCode": statusCode,
    "headers": {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN
    },
    "body": body
  });

};



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


