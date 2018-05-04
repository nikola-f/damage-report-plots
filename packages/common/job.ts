import {GetItemOutput, QueryOutput} from 'aws-sdk/clients/dynamodb';
import {Job, JobStatus, CreateJobMessage, Session} from './types';

import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();


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
      for(let item of qo.Items) {
        //TODO マッピング
        console.log('item:', item);
      }
    }

  }catch(err){
    console.error('getJobList:', err);
  }finally{
    return Promise.resolve(jobs);
  }

};


export const validateCreateMessage = async (cjm: CreateJobMessage, user: Session): Promise<boolean> => {

  // csrf対策はfront側で。
  
  // rangeが0-90日でないならNG
  const range: number = cjm.rangeToTime - cjm.rangeFromTime;
  if(range < 0 ||
     range > 1000*60*60*24*90) {
    return Promise.resolve(false);
  }
  
  // job実行に必要なtokenがないならNG
  if(!user.tokens.jobAccessToken || !user.tokens.jobRefreshToken) {
    return Promise.resolve(false);
  }
  
  // 同agentの未完了のjobが存在するならNG
  const jobRes: QueryOutput = await dynamo.query({
    "TableName": 'job',
    "KeyConditionExpression": 'openId = :o',
    "FilterExpression": 'status IN (:s0, :s1)',
    "ExpressionAttributeValues": {
      ":o": user.openId,
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
