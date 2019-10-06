import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {MessageList, Message} from 'aws-sdk/clients/sqs';
import {Agent, OneReportMessage, Job} from ':common/types';

import * as crypto from 'crypto';
import * as launcher from ':common/launcher';
import * as util from ':common/util';
import * as env from ':common/env';
import * as libAuth from ':common/auth';
import * as libQueue from './lib/queue';
import * as base64 from 'urlsafe-base64';
import {google} from 'googleapis';
const dateFormat = require('dateformat');
const sheets = google.sheets('v4');
const SHEETS_DEF = require('./lib/sheetsdef.json');


import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);


/**
 * spreadsheetsの作成
 * @next putAgent, queueThreads
 */
export const createSheets = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);
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
        
    }catch(error){
      console.info(error);
      continue;
    }

    if(spreadsheetId) {
      // agentデータ保存
      job.agent.spreadsheetId = spreadsheetId;
      launcher.putAgentAsync(job.agent);
  
      launcher.queueThreadsAsync({
        "job": job
      });
    }
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
  
};


/**
 * sheetsの存在チェック・不存在ならcreateSheets
 * @next createSheets, queueThreads
 */
export const checkSheetsExistence = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {

    let found: boolean = false;
    const job: Job = JSON.parse(rec.Sns.Message);
    
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
          found = true;
        }
      }catch(error){
        console.error(error);
        // 存在しない以外のエラーだったら次のsns record
        if(!util.isSet(() => error.response.status) || 
            error.response.status !== 404) {
          continue;
        }
      }
    }

    // 存在すればqueueThreads
    if(found) {
      console.log('spreadsheet found');
      launcher.queueThreadsAsync({
        "job": job
      });
    // 存在しなければcreateSheets
    }else{
      console.log('spreadsheet not found, try to create');
      launcher.createSheetsAsync(job);
    }
  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


/**
 * reportデータの保存
 * @next appendReportsToSheets, finalizeJob
 */
export const appendReportsToSheets = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);
    console.log('try to append reports:', job.openId);
    
    // reportキューからreportを取得
    const reportArrayMessages: MessageList =
      await libQueue.receiveMessageBatch(job.report.queueUrl, env.REPORTS_ARRAY_DEQUEUE_COUNT);
    if(reportArrayMessages.length <= 0) {
      console.log('no reports queued.');
    }
    const reportRows: any[] = [];
    const now = new Date();
    for(const aReportArrayMessage of reportArrayMessages) {
      const reportArray: OneReportMessage[] = JSON.parse(aReportArrayMessage.Body);
      for(const aReport of reportArray) {
        const md5 = crypto.createHash('md5');
        const buf = md5
          .update(String(aReport.portal.latitude))
          .update(String(aReport.portal.longitude))
          .digest();

        reportRows.push([
          base64.encode(buf),
          aReport.portal.latitude,
          aReport.portal.longitude,
          aReport.portal.owned ? 1 : 0,
          `${aReport.mailDate},${aReport.portal.name}`,
          dateFormat(now, 'isoDateTime')
        ]);
      }
    }

    const client = libAuth.createGapiOAuth2Client(
      env.GOOGLE_CALLBACK_URL_JOB,
      job.tokens.jobAccessToken,
      job.tokens.jobRefreshToken
    );


    try {
      const appendRes = await sheets.spreadsheets.values.append({
        "spreadsheetId": job.agent.spreadsheetId,
        "range": 'reports!A2:F2',
        "valueInputOption": 'USER_ENTERED',
        "insertDataOption": 'INSERT_ROWS',
        "resource": {
          "range": 'reports!A2:F2',
          "values": reportRows
        },
        "auth": client
      });
      console.info('reports appended:', appendRes.data);

    }catch(error){
      console.info(error);
      continue;
    }


    // reportキューに残があれば再帰
    // 残がなければ finalizeJobへ
    // TODO finalizeJobの前にmUpx集計
    const reportRemain: number =
      await libQueue.getNumberOfMessages(job.report.queueUrl);
    if(reportRemain > 0) {
      console.log(`${reportRemain} reports remaining, recurse.`);
      launcher.appendReportsToSheetsAsync(job);
    }else{
      launcher.finalizeJobAsync(job);
    }

  }
  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


