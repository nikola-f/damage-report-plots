import {GetItemOutput} from 'aws-sdk/clients/dynamodb';
import {Agent} from './types';


import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();



export const getAgent = async (openId: string): Promise<Agent> => {
  console.log('try to get agent:', openId);

  let agent: Agent = undefined;

  try {
    const res: GetItemOutput = await dynamo.get({
      "TableName": "agent",
      "Key": {
        "openId": openId
      },
      "ConsistentRead": false
    }).promise();
    
    // console.log('result:', res);

    if(res.Item) {
      agent = {
        "openId": openId,
        "createTime": <number>res.Item.createTime,
        "lastAccessTime": Date.now(),
        "reportTableId": <string>res.Item.reportTableId,
        "mUpv": <number>res.Item.mUpv,
        "mUpc": <number>res.Item.mUpc,
      };
    }

  }catch(err){
    console.log(err);

  }finally{
    return Promise.resolve(agent);
  }

};
