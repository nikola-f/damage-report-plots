import {GetItemOutput, QueryOutput} from 'aws-sdk/clients/dynamodb';
import {APIGatewayEvent} from 'aws-lambda';
import {Job, JobStatus, CreateJobMessage, Session} from './types';

import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();


export async function checkCreateJobMessage(cjm: CreateJobMessage, hashedId: string): Promise<boolean> {
  
  // rangeが0-90日でないならNG
  const range: number = cjm.rangeToTime - cjm.rangeFromTime;
  if(range < 0 ||
     range > 1000*60*60*24*90) {
    return Promise.resolve(false);
  }


  // sessionに保存済みのstateでないならNG
  // if(!session || session === '' || !cjm.stateToken || cjm.stateToken === '') {
  //   return Promise.resolve(false);
  // }
  // const sessionRes: GetItemOutput = await dynamo.get({
  //   "TableName": "session",
  //   "Key": {
  //     "sessionId": session
  //   },
  //   "ConsistentRead": false
  // }).promise();
  // if(!sessionRes.Item || sessionRes.Item.ttl <= Date.now()) {
  //   return Promise.resolve(false);
  // }
  // if(sessionRes.Item.stateToken !== cjm.stateToken) {
  //   return Promise.resolve(false);
  // }
  


  // 同agentの未完了のjobが存在するならNG
  const jobRes: QueryOutput = await dynamo.query({
    "TableName": 'job',
    "KeyConditionExpression": 'hashedId = :h',
    "FilterExpression": 'status IN (:s0, :s1)',
    "ExpressionAttributeValues": {
      ":h": hashedId,
      ":s0": JobStatus.Created,
      ":s1": JobStatus.Processing
    },
    "Limit": 1
  }).promise();
  if(jobRes.Items) {
    return Promise.resolve(false);
  }

  
  return Promise.resolve(true);
};
