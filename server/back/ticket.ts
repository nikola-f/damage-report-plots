import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {GetQueueAttributesRequest, QueueAttributeName,
  GetQueueAttributesResult, SendMessageBatchRequest,
  ReceiveMessageRequest, ReceiveMessageResult,
  DeleteMessageBatchRequest, DeleteMessageBatchResult} from 'aws-sdk/clients/sqs';
import {UpdateItemOutput} from 'aws-sdk/clients/dynamodb';


import qu = require('./sub/_queue');
import awsXRay = require('aws-xray-sdk');
import awsPlain = require('aws-sdk');
const AWS = awsXRay.captureAWS(awsPlain);
const sqs: AWS.SQS = new AWS.SQS(),
      dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient()
;

const TICKET_GENERATE_UNIT = Number(process.env.TICKET_GENERATE_UNIT)
;


/**
 * チケット生成
 * @next -
 */
export async function generateTicket(event, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

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
          "Value": TICKET_GENERATE_UNIT
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


/**
 * チケット消費
 * @next -
 */
export async function consumeTicket(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const count: number = JSON.parse(rec.Sns.Message);

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

  }
};
