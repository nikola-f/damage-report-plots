import {SNSEvent, Handler, ProxyHandler,
  APIGatewayEvent} from 'aws-lambda';
import {GetItemOutput} from 'aws-sdk/clients/dynamodb';
import {Session} from '../types';

import se = require('./sub/_session');

import awsXRay = require('aws-xray-sdk');
import awsPlain = require('aws-sdk');
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();




/**
 * sessionの有効性チェック
 */
export async function isValid(event: APIGatewayEvent, context, callback): Promise<void> {
  
  const session = se.toSession(event.headers.Cookie);
  
  let effect = 'Deny';

  if(session) {
    try {    
      const res: GetItemOutput = await dynamo.get({
        "TableName": "session",
        "Key": {
          "sessionId": session
        },
        "ConsistentRead": false
      }).promise();

      if(res.Item && res.Item.ttl > Date.now()) {
        effect = 'Allow';
      }

    }catch(err){
      console.log(err);

    }finally{
      callback(null, {
        "principalId": session,
        "policyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Action": "execute-api:Invoke",
              "Effect": effect,
              "Resource": `arn:aws:execute-api:${process.env.ARN_REGION_ACCOUNT}:*/*/*`
            }
          ]
        }
      });
    }

  }


};


/**
 * サインイン
 * @next -
 */
export async function signin(event: APIGatewayEvent, context, callback): Promise<void> {
};

/**
 * sessionをdb保存
 * @next -
 */
export async function putSession(event: SNSEvent, context, callback): Promise<void> {

  if(event.Records) {
    for(const rec of  event.Records) {
      const session: Session = JSON.parse(rec.Sns.Message);

    }
  }

};
