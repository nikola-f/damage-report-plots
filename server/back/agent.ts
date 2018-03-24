import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {Agent, JobStatus, CreateJobMessage} from '../types';

import lc = require('../launcher');
import awsXRay = require('aws-xray-sdk');
import awsPlain = require('aws-sdk');
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient()
;


/**
 * agentの保存
 * @next -
 */
export async function putAgent(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const agent: Agent = JSON.parse(rec.Sns.Message);

    agent.lastAccessTime = Date.now();

    dynamo.put({
      "TableName": "agent",
      "Item": agent
    }).promise()
    .then(() => {
      console.log('put agent:' + JSON.stringify(agent));
    })
    .catch(err => {
      console.error(err);
      callback(err, null);
      return;
    });
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};
