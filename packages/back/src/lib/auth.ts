import * as env from '../lib/env';
import {Session} from '@common/types';
import {GetItemOutput, DeleteItemOutput} from 'aws-sdk/clients/dynamodb';
import * as cryptoRandomString from 'crypto-random-string';
import {google} from 'googleapis';

import {OAuth2Client} from 'google-auth-library';
import * as AWS from 'aws-sdk';
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();

const authClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);



/**
 * validate jwt and return payload
 */
export const getPayload = async (token: string): Promise<Object> => {
  
  try {
    const ticket = await authClient.verifyIdToken({
      "idToken": token,
      "audience": env.GOOGLE_CLIENT_ID
    });
    // const payload = ticket.getPayload();
    return ticket.getPayload();
  }catch(err){
    console.error(err);
    return null;
  }

};

/**
 * get session from db
 */
export const getSession = async (sessionId: string): Promise<Session> => {

  try {
    const res: GetItemOutput = await dynamo.get({
      "TableName": "session",
      "Key": {
        "sessionId": sessionId
      },
      "ConsistentRead": false
    }).promise();
    console.log('get session:', res);

    if(res.Item) {
      return {
        "sessionId": sessionId,
        "openId": <string>res.Item.openId,
        "idToken": <string>res.Item.idToken,
        "createTime": <number>res.Item.createTime
      };
    }else{
      return null;
    }
    
  }catch(err){
    console.error(err);
    return null;
  }
};


/**
 * delete session from db
 */
export const deleteSession = async (sessionId: string): Promise<boolean> => {

  try {
    const res: DeleteItemOutput = await dynamo.delete({
      "TableName": "session",
      "Key": {
        "sessionId": sessionId
      },
      "ReturnValues": "ALL_OLD"
    }).promise();
    console.log('delete session:', res);

    return res.Attributes !== null;
    
  }catch(err){
    console.error(err);
    return false;
  }
};


/** 
 * create and store session
 */
export const createSession = async (openId: string, idToken: string): Promise<Session> => {
  
  const session: Session = {
    "sessionId": cryptoRandomString({length: 32, type: 'base64'}),
    "openId": openId,
    "idToken": idToken,
    "createTime": Date.now(), //millisec
    "ttl": Math.floor(Date.now() / 1000) + env.SESSION_TTL //sec
  };
  try {
    await dynamo.put({
      "TableName": "session",
      "Item": session
    }).promise();
    console.log('done put session:' + JSON.stringify(session));
    return session;    
  }catch(err){
    console.error(err);
    return null;
  }
  
};






/**
 * create gapiClient
 */
export const createGapiOAuth2Client = 
    (redirectUrl: string, accessToken?: string): OAuth2Client => {

  console.info(
    'try to create client:', 
    accessToken? accessToken.substr(-4): ''
  );

  if(!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw(new Error('google credential ENV not set.'))
  }
  
  const oauth2Client: OAuth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUrl
  );
  if(accessToken) {
    oauth2Client.setCredentials({
      "access_token": accessToken
      // "refresh_token": refreshToken
    });
  }

  return oauth2Client;
};



/**
 * revoke
 */
export const revokeToken = 
        async (redirectUrl: string, accessToken: string): Promise<any> => {
  console.info('try to revoke tokens:', accessToken.substr(-4));

  return new Promise((resolve, reject) => {
    const client = createGapiOAuth2Client(redirectUrl, accessToken);
    client.revokeCredentials((err, res) => {
      if(err) {
        console.error(err);
        reject(err);
      }else{
        console.info('revoked:', res);
        resolve(res);
      }
    });
  });
}


