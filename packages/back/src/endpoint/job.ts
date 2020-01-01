import {SNSEvent, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {Job, JobStatus, CreateJobRequest, Range} from '@common/types';

import * as env from '../lib/env';
import * as libTicket from '../lib/ticket';
import * as libMail from '../lib/mail';
import * as libRange from '../lib/range';
import * as libAgent from '../lib/agent';
import * as libJob from '../lib/job';
import * as libSheets from '../lib/sheets';
import * as launcher from '../lib/launcher';
import * as libAuth from '../lib/auth';
import * as util from '@common/util';
// import * as awsXRay from 'aws-xray-sdk';
import * as AWS from 'aws-sdk';
// const AWS = awsXRay.captureAWS(awsPlain);
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
    "accessToken": req.accessToken,
    // "tokens": {
    //   "jobAccessToken": req.accessToken
    // },
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
    if(!await libSheets.exists(job)) {
      job.agent.spreadsheetId = await libSheets.create(job);
      launcher.putAgentAsync(job.agent);
    }

    // get raw ranges
    const rawRanges: Range[] = libRange.getRawRanges(job.lastReportTime);
    if(rawRanges.length <= 0) {
      console.info('no raw ranges.');
      return;
    }

    // filter ranges
    job.ranges = await libMail.filterRanges(job.accessToken, rawRanges);
    if(job.ranges.length <= 0) {
      console.info('no fltered ranges.');
      return;
    }
    
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
    libAuth.revokeToken(
      env.GOOGLE_CALLBACK_URL_JOB,
      job.accessToken
      // job.tokens.jobAccessToken,
      // job.tokens.jobRefreshToken
    );
    job.accessToken = null;

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
    job.accessToken = null;
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



