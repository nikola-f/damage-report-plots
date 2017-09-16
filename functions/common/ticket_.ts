import {GetItemOutput} from 'aws-sdk/clients/dynamodb';
import {Job} from '../types';
import lc = require('../common/launcher');
import AWS = require('aws-sdk');
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient()



export function computeAmount(job: Job): number {
  return 100;
};


export async function hasAvailable(): Promise<boolean> {
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
