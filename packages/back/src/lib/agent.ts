import {GetItemOutput} from 'aws-sdk/clients/dynamodb';
import {Agent} from '@common/types';


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
    
    console.log('get agent:', res);

    if(res.Item) {
      agent = {
        "openId": openId,
        "createTime": <number>res.Item.createTime,
        "lastAccessTime": Date.now(),
        "spreadsheetId": <string>res.Item.spreadsheetId,
      };
    }

  }catch(err){
    console.log('error on get agent', JSON.stringify(err));

  }finally{
    return Promise.resolve(agent);
  }

};
