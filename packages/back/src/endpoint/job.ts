import {SNSEvent, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {Job, JobStatus, Range} from '@common/types';
import {OAuth2Client} from 'google-auth-library';
// import {AuthResponse} from 'gapi.auth2';

import * as util from '@common/util';
import * as env from '../lib/env';
import * as libTicket from '../lib/ticket';
import * as libMail from '../lib/mail';
import * as libRange from '../lib/range';
import * as libAgent from '../lib/agent';
import * as libJob from '../lib/job';
import * as libSheets from '../lib/sheets';
import * as launcher from '../lib/launcher';
import * as libAuth from '../lib/auth';
import * as AWS from 'aws-sdk';
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();


/**
 * list job for specified user
 */
export const listJob = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }

  const auth = JSON.parse(event.body);
  // validate jwt & get openid
  const payload = await libAuth.getPayload(auth.id_token);
  if(!payload) {
    return util.BAD_REQUEST;
  }

  // get list
  const jobs = await libJob.getJobList(payload['sub']);
  
  let statusCode, body = null;
  if(jobs && jobs.length > 0) {
    statusCode = 200;
    body = JSON.stringify(jobs);
  }else{
    statusCode = 404;
  }
  return {
    "statusCode": statusCode,
    "headers": {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN
    },
    "body": body
  };
};



/**
 * check state can create job
 */
export const canCreateJob = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }

  const auth = JSON.parse(event.body);
  const payload = await libAuth.getPayload(auth.id_token);
  if(!payload) {
    return util.BAD_REQUEST;
  }
  
  const openId = payload['sub'];
  const canCreate: boolean = !await libJob.hasHotJob(openId) && await libTicket.hasAvailable();
    
  return {
    "statusCode": 200,
    "headers": {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN
    },
    "body": String(canCreate)
  };

};


/**
 * create job and go
 * @next preExecuteJob, putJob
 */
export const createJob = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if(!util.isValidAPIGatewayProxyEvent(event)) {
    return util.BAD_REQUEST;
  }

  // const auth: AuthResponse = JSON.parse(event.body);
  const auth = JSON.parse(event.body);

  // validate jwt
  // let payload;
  // try {
  //   payload = await libAuth.verifyIdToken(auth.id_token);
  // }catch(err){
  //   console.error(err);
  //   return util.BAD_REQUEST;
  // }

  // validate jwt & get openid
  const payload = await libAuth.getPayload(auth.id_token);
  if(!payload) {
    return util.BAD_REQUEST;
  }

  // get agent
  const openId = payload['sub'];
  let agent = await libAgent.getAgent(openId);
  if(!agent) {
    console.error('agent not found.');
    return util.BAD_REQUEST;
  }
  

  // instantiate job
  const createTime = Date.now();
  const job: Job = {
    "openId": openId,
    "createTime": createTime,
    
    "status": JobStatus.Created,
    "lastAccessTime": createTime,
    "accessToken": auth.access_token,
    "expiredAt": auth.expired_at,
    "agent": agent
  };

  // preExecute
  await launcher.preExecuteJobAsync(job);

  // save db
  await launcher.putJobAsync(job);


  return {
    "statusCode": 200,
    "headers": {
      "Access-Control-Allow-Origin": env.CLIENT_ORIGIN
    },
    "body": String(createTime)
  };
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
    job.status = JobStatus.Processing;

    // check exists, create spreadsheets
    const client: OAuth2Client = libAuth.createGapiOAuth2Client(
      env.GOOGLE_CALLBACK_URL,
      job.accessToken
    );
    if(!await libSheets.exists(job, client)) {
      job.agent.spreadsheetId = await libSheets.create(client);
      launcher.putAgentAsync(job.agent);
    }else{
      job.lastReportTime = await libSheets.getLastReportTime(job, client);
    }

    // get raw ranges
    const rawRanges: Range[] = libRange.getRawRanges(job.lastReportTime);
    if(!rawRanges || rawRanges.length <= 0) {
      console.info('no raw ranges.');
      libJob.cancel(job);
      continue;
    }

    // filter ranges
    job.ranges = await libMail.filterRanges(job.accessToken, rawRanges);
    if(!job.ranges || job.ranges.length <= 0) {
      console.info('no fltered ranges.');
      libJob.done(job);
      continue;
    }
    
    // create job queue
    await libJob.createJobQueue(job);

    // go next, queue threads
    await launcher.queueThreadsAsync({
      "job": job,
      "range": job.ranges[0]
    });

    // save job
    await launcher.putJobAsync(job);
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
      libJob.cancel(job);
      continue;
    }

    // revoke
    await libAuth.revokeToken(
      env.GOOGLE_CALLBACK_URL,
      job.accessToken
    );
    job.accessToken = null;

    // save db
    await launcher.putJobAsync(job);
  }

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

    await dynamo.put({
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



