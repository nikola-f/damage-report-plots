import {SNSEvent, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {Job, JobStatus, CreateJobRequest} from '@common/types';

const env = require(':common/env');

import * as libTicket from '../lib/ticket';
import * as libAgent from '../lib/agent';
import * as libJob from '../lib/job';
import * as libSheets from '../lib/sheets';
import * as launcher from '@common/launcher';
import * as libAuth from '@common/auth';
import * as util from '@common/util';
import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();



/**
 * create job and go
 * @next preExecuteJob, putJob
 */
export const createJob = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }

  const req: CreateJobRequest = JSON.parse(event.body);

  // validate jwt
  let payload;
  try {
    payload = await libAuth.verifyIdToken(req.jwt);
  }catch(err){
    console.error(err);
    return util.BAD_REQUEST;
  }

  // get agent
  const openId = payload['sub'];
  let agent = await libAgent.getAgent(openId);

  // instantiate job
  const createTime = Date.now();
  const job: Job = {
    "openId": openId,
    "createTime": createTime,
    
    "status": JobStatus.Created,
    "lastAccessTime": createTime,
    "tokens": {
      "jobAccessToken": req.accessToken
    },
    "agent": agent
  }

  // save db
  launcher.putJobAsync(job);

  // preExecute
  launcher.preExecuteJobAsync(job);

  return util.OK;
};



/**
 * pre execute
 * @next putAgent, putJob, queueThreads
 */
export const preExecuteJob = async (event: SNSEvent): Promise<void> => {
  if(!util.isValidSNSEvent(event)) {
    return;
  }
  
  for(let rec of event.Records) {
    let job: Job = JSON.parse(rec.Sns.Message);
    console.info('try to preExecute', job.openId);

    // create job queue
    libJob.createJobQueue(job);

    // check exists, create spreadsheets
    if(await libSheets.exists(job)) {
      job.agent.spreadsheetId = await libSheets.create(job);
      launcher.putAgentAsync(job.agent);
    }
    
    
    // add ranges
    
    
    
    // go next, queue threads
  }
  
};



/**
 * finalize job
 * @next putJob
 */
export const postExecuteJob = async (event: SNSEvent): Promise<void> => {
  if(!util.isValidSNSEvent(event)) {
    return;
  }

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    try {
      await libJob.deleteJobQueue(job);
      await libTicket.consume(job);

      job.status = JobStatus.Done;
    }catch(err){
      console.error(err);
      job.status = JobStatus.Cancelled;
    }

    // revoke
    libAuth.revokeTokens(
      env.GOOGLE_CALLBACK_URL_JOB,
      job.tokens.jobAccessToken,
      job.tokens.jobRefreshToken
    );
    job.tokens = null;

    // save db
    launcher.putJobAsync(job);

  }
  
  return;
};



/**
 * save job on db
 * @next -
 */
export const putJob = async (event: SNSEvent): Promise<void> => {
  if(!util.isValidSNSEvent(event)) {
    return;
  }
  

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);

    job.lastAccessTime = Date.now();
    // ignore tokens,agent
    job.tokens = null;
    job.agent = null;

    dynamo.put({
      "TableName": "job",
      "Item": job
    }).promise()
    .then(() => {
      console.info('put job:', job);
    })
    .catch(err => {
      console.error(err);
      throw err;
    });
  }

  return;
};



