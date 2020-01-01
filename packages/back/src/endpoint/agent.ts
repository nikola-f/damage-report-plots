import {SNSEvent, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {CreateQueueRequest} from 'aws-sdk/clients/sqs';
import {Agent, Job} from '@common/types';

import * as util from '@common/util';
import * as launcher from '../lib/launcher';
import * as env from '../lib/env';
import * as libAgent from '../lib/agent';
import * as libAuth from '../lib/auth';

// import * as awsXRay from 'aws-xray-sdk';
import * as AWS from 'aws-sdk';
// const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();

// const sqs: AWS.SQS = new AWS.SQS();



/**
 * agentの登録
 * @next -
 */
export const signup = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }

  // token検証  
  let payload;
  try {
    payload = await libAuth.verifyIdToken(event.body);
  }catch(err){
    console.error(err);
    return util.BAD_REQUEST;
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
    console.error('agent already exists.');
    statusCode = 400;
    body = 'bad request';
  }

  return {
    "statusCode": statusCode,
    "headers": {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN
    },
    "body": body
  };

};


/**
 * agentのログイン
 * @next -
 */
export const signin = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }

  // token検証  
  let payload;
  try {
    payload = await libAuth.verifyIdToken(event.body);
  }catch(err){
    console.error(err);
    return util.BAD_REQUEST;
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
  return {
    "statusCode": statusCode,
    "headers": {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN
    },
    "body": body
  };

};



/**
 * agentの保存
 * 全カラム
 * @next -
 */
export const putAgent = async (event: SNSEvent): Promise<void> => {
  if(!util.isValidSNSEvent(event)) {
    return;
  }

  for(let rec of event.Records) {
    const agent: Agent = JSON.parse(rec.Sns.Message);

    agent.lastAccessTime = Date.now();

    try {
      await dynamo.put({
        "TableName": "agent",
        "Item": agent
      }).promise();
      console.log('done put agent:' + JSON.stringify(agent));
    }catch(err){
      console.error(err);
    };
  }
  
  return;
};

