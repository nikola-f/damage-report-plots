import {SNSEvent, Handler, ProxyHandler,
  APIGatewayEvent} from 'aws-lambda';
import {GetItemOutput} from 'aws-sdk/clients/dynamodb';
import {Agent} from '@damage-report-plots/common/types';


import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();


export const getAgent = async (openId: string): Promise<Agent> => {
  console.log(JSON.stringify(event));

  let agent: Agent = undefined;

  try {    
    const res: GetItemOutput = await dynamo.get({
      "TableName": "agent",
      "Key": {
        "openId": openId
      },
      "ConsistentRead": false
    }).promise();

    if(res.Item) {
      agent.openId = openId;
      agent.createTime = <number>res.Item.createTime;
      agent.lastAccessTime = Date.now();
      agent.reportTableId = <string>res.Item.reportTableId;
    }

  }catch(err){
    console.log(err);

  }finally{
    return Promise.resolve(agent);
  }

};
