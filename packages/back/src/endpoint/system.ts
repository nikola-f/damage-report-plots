import {ScheduledEvent} from 'aws-lambda';
import {UpdateItemOutput} from 'aws-sdk/clients/dynamodb';

import * as AWS from 'aws-sdk';
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient()
;

const TICKET_GENERATE_UNIT = Number(process.env.TICKET_GENERATE_UNIT)
;


/**
 * generate and save
 * @next -
 */
export const generateTicket = async (event: ScheduledEvent): Promise<void> => {
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
    throw err;
  }
  console.log('ticket remain updated:' + JSON.stringify(res));
  
  return;
};


