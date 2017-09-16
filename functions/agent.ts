import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {Agent, JobStatus, CreateJobMessage} from './types';

import AWS = require('aws-sdk');
import lc = require('./common/launcher');
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient()
;



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
