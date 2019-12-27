import {SNSEvent, Handler, ProxyResult, ScheduledEvent} from 'aws-lambda';
import {UpdateItemOutput} from 'aws-sdk/clients/dynamodb';


// import * as queue from './lib/queue';
import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient()
;

const TICKET_GENERATE_UNIT = Number(process.env.TICKET_GENERATE_UNIT)
;


/**
 * チケット生成
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
    return;
  }
  console.log('ticket remain updated:' + JSON.stringify(res));
  
  return;
  // callback(null, {
  //   "statusCode": 200,
  //   "body": {}
  // });
};


/**
 * チケット消費
 * @next -
 */
// export const consumeTicket = async (event: SNSEvent, context, callback): Promise<void> => {
//   console.log(JSON.stringify(event));

//   for(let rec of event.Records) {
//     const count: number = JSON.parse(rec.Sns.Message);

//     let res: UpdateItemOutput;
//     try {
//       res = await dynamo.update({
//         "TableName": "ticket",
//         "Key": {
//           "name": 'default'
//         },
//         "AttributeUpdates": {
//           "remain": {
//             "Action": 'ADD',
//             "Value": -count
//           }
//         },
//         "ReturnValues": 'UPDATED_NEW'
//       }).promise();
//     }catch(err){
//       console.error(err);
//       return;
//     }
//     console.log('ticket remain updated:' + JSON.stringify(res));

//   }

//   callback(null, {
//     "statusCode": 200,
//     "body": {}
//   });
// };
