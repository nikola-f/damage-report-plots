import {Job} from '@common/types';

import * as util from ':common/util';
import * as env from ':common/env';
import * as libAuth from ':common/auth';
// import * as libQueue from './lib/queue';
import {google} from 'googleapis';
const sheets = google.sheets('v4');
const SHEETS_DEF = require('./sheetsdef.json');


import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);


/**
 * spreadsheetsの作成
 * @next putAgent, queueThreads
 */
export const createSheets = async (job: Job): Promise<string> => {

  const client = libAuth.createGapiOAuth2Client(
    env.GOOGLE_CALLBACK_URL_JOB,
    job.tokens.jobAccessToken,
    job.tokens.jobRefreshToken
  );

  let spreadsheetId: string;
  try {
    const createRes = await sheets.spreadsheets.create({
      "resource": SHEETS_DEF,
      "auth": client
    });
    console.info('raw sheets created:', createRes.data);
    spreadsheetId = createRes.data.spreadsheetId;
    
    return spreadsheetId;
  }catch(err){
    console.error(err);
    throw err;
  }

  // if(spreadsheetId) {
  //   // agentデータ保存
  //   job.agent.spreadsheetId = spreadsheetId;
  //   launcher.putAgentAsync(job.agent);
  // }
};


/**
 * sheetsの存在チェック・不存在ならcreateSheets
 * @next createSheets, queueThreads
 */
export const sheetsExists = async (job: Job): Promise<boolean> => {

  // let found: boolean = false;
  // const job: Job = JSON.parse(rec.Sns.Message);
  
  // // agent情報取得
  // const agent = await libAgent.getAgent(job.openId);

  // spreadSheetsIdがあれば現物の存在チェック
  if(job.agent && job.agent.spreadsheetId) {
    const client = libAuth.createGapiOAuth2Client(
      env.GOOGLE_CALLBACK_URL_JOB,
      job.tokens.jobAccessToken,
      job.tokens.jobRefreshToken
    );

    try {
      const res: any = await sheets.spreadsheets.get({
        "spreadsheetId": job.agent.spreadsheetId,
        "includeGridData": false,
        "auth": client
      });
      console.log('checked:', res.data);
      if(util.isSet(() => res.data.spreadsheetId)) {
        console.log('spreadsheet found');
        return true;
      }
    }catch(err){
      console.error(err);
      // 存在しない以外のエラーだったらthrow
      if(!util.isSet(() => err.response.status) || 
          err.response.status !== 404) {
        throw err;
      }
    }
  }

  console.log('spreadsheet not found.');
  return false;


  // 存在すればqueueThreads
  // if(found) {
  //   console.log('spreadsheet found');
  //   return true;
  // }else{
  //   // launcher.queueThreadsAsync({
  //   //   "job": job
  //   // });
  // // 存在しなければcreateSheets
  // // }else{
  //   console.log('spreadsheet not found, try to create');
  //   return false;
  // //   launcher.createSheetsAsync(job);
  // }
};


