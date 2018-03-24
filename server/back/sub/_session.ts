import cookieLib = require('cookie');
import {Session} from '../../types';
import {GetItemOutput} from 'aws-sdk/clients/dynamodb';

import awsXRay = require('aws-xray-sdk');
import awsPlain = require('aws-sdk');
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();


/**
 * Cookie文字列からSessionを返す
 */
export function toSession(cookie: string): string {
  let session = undefined;
  try {
    session = cookieLib.parse(cookie).Session;
  }catch(err){
    console.log(JSON.stringify(err));
  }finally{
    return session;
  }
};


export async function getSession(cookie: string, stateToken: string): Promise<Session> {

  let session: Session = undefined;

  try {
    const sessionId = cookieLib.parse(cookie).Session;
    if(sessionId) {
    
      const res: GetItemOutput = await dynamo.get({
        "TableName": "session",
        "Key": {
          "sessionId": sessionId
        },
        "ConsistentRead": false
      }).promise();
      
      if(res.Item && stateToken && stateToken === res.Item.stateToken) {
        session.sessionId = sessionId;
        session.createTime = <number>res.Item.createTime;
        session.lastAccessTime = Date.now();
        session.ttl = <number>res.Item.ttl;
        session.hashedId = <string>res.Item.hashedId;
        session.tokens = res.Item.tokens;
        session.stateToken = <string>res.Item.stateToken;
      }
    }
    
  }catch(err){
    console.log(JSON.stringify(err));
  }finally{
    return Promise.resolve(session);
  }

};
