import {GetItemOutput, UpdateItemOutput} from 'aws-sdk/clients/dynamodb';
import {Job} from '@common/types';

import * as AWS from 'aws-sdk';
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient()



export const consume = async (job: Job): Promise<void> => {
  
  const count = 1 + Math.ceil(job.report.queuedCount / 50);
  
  let res: UpdateItemOutput;
  try {
    res = await dynamo.update({
      "TableName": "ticket",
      "Key": {
        "name": 'default'
      },
      "AttributeUpdates": {
        "remain": {
          "Action": 'ADD',
          "Value": -count
        }
      },
      "ReturnValues": 'UPDATED_NEW'
    }).promise();
  }catch(err){
    console.error(err);
    return;
  }
  console.log('ticket remain updated:' + JSON.stringify(res));
};




export const hasAvailable = async (): Promise<boolean> => {
  let result: boolean = false;
  try {
    const res: GetItemOutput = await dynamo.get({
      "TableName": 'ticket',
      "Key": {
        "name": 'default'
      }
    }).promise();
    if(res.Item.remain && res.Item.remain > 0) {
      result = true;
    }
  }catch(err){
    console.error(err);
  }finally{
    return result;
  }
};
