import {SNSEvent, APIGatewayProxyEvent, APIGatewayProxyResult, CustomAuthorizerEvent, CustomAuthorizerResult} from 'aws-lambda';
import {Agent, Session} from '@common/types';

import * as util from '@common/util';
import * as launcher from '../lib/launcher';
import * as env from '../lib/env';
import * as libAgent from '../lib/agent';
import * as libAuth from '../lib/auth';
import * as cookie from 'cookie';
import DENY_POLICY from '../lib/denyPolicy.json';

import * as AWS from 'aws-sdk';
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();


/**
 * authorize request
 */
export const authorize = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {

  console.log('authEvent:', event);
  
  if(!event.headers.Cookie) {
    console.log('cookie not sent');
    return DENY_POLICY;
  }
  
  const cookies = cookie.parse(event.headers.Cookie);
  if(!cookies.sessionId) {
    console.log('session not sent');
    return DENY_POLICY;
  }
  const session: Session = await libAuth.getSession(cookies.sessionId);
  if(!session) {
    console.log('session not found');
    return DENY_POLICY;
  }

  const result = {
    "principalId": session.sessionId,
    "policyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "execute-api:Invoke",
          "Effect": "Allow",
          "Resource": event.methodArn
        }
      ]
    },
    "context": {
      "idToken": session.idToken
    }
  };
  console.log('session found:', result);
  return result;
};


/**
 * sign out agent
 */
export const signout = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }

  const cookies = cookie.parse(event.headers.Cookie || '');
  // console.log('cookies:', cookies);
  let statusCode = null, body = null;
  if(cookies.sessionId && await libAuth.deleteSession(cookies.sessionId)) {
    statusCode = 200;
    body = 'session deleted';
  }else{
    statusCode = 204;
    body = 'session not found';
  }
  const headers = {
    "Access-Control-Allow-Origin": env.CLIENT_ORIGIN,
    "Access-Control-Allow-Credentials": 'true',
    "Set-Cookie": `sessionId=; ` +
                  `Max-Age=0; `+
                  `SameSite=${env.SAME_SITE}; `+
                  "Path=/; Secure; HttpOnly"
  };
  return {
    "statusCode": statusCode,
    "headers": headers,
    "body": body
  };
  
};


/**
 * get agent profile
 */
export const getAgent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }
  
  const idToken = event.requestContext.authorizer.idToken;
  if(!idToken) {
    console.error('idToken not found.');
    return util.BAD_REQUEST;
  }

  const payload = await libAuth.getPayload(idToken);
  const openId = payload['sub'];
  if(!payload || !openId) {
    console.error('cannot verify idToken.');
    return util.BAD_REQUEST;
  }
  
  const agent = await libAgent.getAgent(openId);
  agent.name = payload['name'];
  agent.picture = payload['picture'];
  agent.locale = payload['locale'];

  return {
    "statusCode": 200,
    "headers": {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN
    },
    "body": JSON.stringify(agent)
  };

};


/**
 * signup agent
 * @next -
 */
export const signup = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }
  
  const idToken = event.body;

  // validate token
  // let payload;
  // try {
  const payload = await libAuth.getPayload(idToken);
  if(!payload) {
    return util.BAD_REQUEST;
  }
  // }catch(err){
  //   console.error(err);
  //   return util.BAD_REQUEST;
  // }

  // load from db
  const openId = payload['sub'];
  let agent: Agent = await libAgent.getAgent(openId);

  // not exists, create
  if(!agent || Object.keys(agent).length === 0) {
    
    agent = {
      "openId": openId,
      "createTime": Date.now(),
      "lastAccessTime": Date.now(),
      "name": payload['name'],
      "picture": payload['picture'],
      "locale": payload['locale']
    }    
    
    launcher.putAgentAsync(agent);

    // create session
    const session: Session = await libAuth.createSession(openId, idToken);
    const MAX_AGE = 3600*24*30; // maybe db session will be expired first.

    return {
      "statusCode": 200,
      "headers": {
        "Access-Control-Allow-Origin": env.CLIENT_ORIGIN,
        "Access-Control-Allow-Credentials": 'true',
        "Set-Cookie": `sessionId=${session.sessionId}; ` +
                      `Max-Age=${MAX_AGE}; `+
                      `SameSite=${env.SAME_SITE}; `+
                      "Path=/; Secure; HttpOnly"
      },
      "body": JSON.stringify(agent)
    };

  // already exists, 400
  }else{
    console.error('agent already exists.');
    return util.BAD_REQUEST;
  }

};


/**
 * sign in agent
 * @next -
 */
export const signin = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }

  // validate token
  const idToken = event.body;
  const payload = await libAuth.getPayload(idToken);
  if(!payload) {
    return util.BAD_REQUEST;
  }

  // load from db
  const openId = payload['sub'];
  const agent = await libAgent.getAgent(openId);

  let statusCode: number;
  let headers = {};
  let body: string = null;

  // not exists, 204
  if(!agent || Object.keys(agent).length === 0) {
    statusCode = 204;
    headers = {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN,
      "Access-Control-Allow-Credentials": 'true'
    };

  // already exists, 200 
  }else{
    statusCode = 200;

    // create session
    const session: Session = await libAuth.createSession(openId, idToken);
    const MAX_AGE = 3600*24*30; // maybe db session will be expired first.
    headers = {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN,
      "Access-Control-Allow-Credentials": 'true',
      "Set-Cookie": `sessionId=${session.sessionId}; ` +
                    `Max-Age=${MAX_AGE}; `+
                    `SameSite=${env.SAME_SITE}; `+
                    "Path=/; Secure; HttpOnly"
    };

    agent.spreadsheetId = agent && agent.spreadsheetId ? agent.spreadsheetId : null;
    agent.name = payload['name'];
    agent.picture = payload['picture'];
    agent.locale = payload['locale'];
    body = JSON.stringify(agent);
  }
  
  return {
    "statusCode": statusCode,
    "headers": headers,
    "body": body
  };

};



/**
 * save db
 * @next -
 */
export const putAgent = async (event: SNSEvent): Promise<void> => {
  if(!util.isValidSNSEvent(event)) {
    return;
  }

  for(let rec of event.Records) {
    const agent: Agent = JSON.parse(rec.Sns.Message);

    agent.lastAccessTime = Date.now();

    try {
      await dynamo.put({
        "TableName": "agent",
        "Item": agent
      }).promise();
      console.log('done put agent:' + JSON.stringify(agent));
    }catch(err){
      console.error(err);
    };
  }
  
  return;
};

