import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {MessageList, Message} from 'aws-sdk/clients/sqs';
import {Agent, OneReportMessage, Job} from ':common/types';

import * as crypto from 'crypto';
import * as launcher from ':common/launcher';
import * as util from ':common/util';
import * as env from ':common/env';
import * as libAgent from ':common/agent';
import * as libAuth from ':common/auth';
import * as libQueue from './lib/queue';
import {google} from 'googleapis';
const fusiontables = google.fusiontables('v2');
const sheets = google.sheets('v4');
const SHEETS_DEF = require('./lib/sheetsdef.json'),
      REPORTS_COUNT: number = Number(process.env.REPORTS_COUNT),
      REPORTS_BATCH_COUNT: number = Number(process.env.REPORTS_BATCH_COUNT);

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
      console.error(JSON.stringify(error));
      continue;
      // callback(error, {
      //   "statusCode": 400,
      //   "body": 'Bad Request'
      // });
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
 * @next insertReports, finalizeJob
 */
export const appendReportsToSheets = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);
    console.log('try to insert reports:', job.openId);
    
    //agentテーブルからreportTableIdを取得
    const agent: Agent = await libAgent.getAgent(job.openId);
    const reportTableId = agent.reportTableId;

    // reportキューからreportを取得
    const queuedMessages: MessageList =
      await libQueue.receiveMessageBatch(job.report.queueUrl, REPORTS_COUNT);
    if(queuedMessages.length <= 0) {
      console.log('no reports queued.');
    }
    const reportMessages: OneReportMessage[] = [];
    for(const aMessage of queuedMessages) {
      const aReport: OneReportMessage = JSON.parse(aMessage.Body);
      reportMessages.push(aReport);
    }

    const client = libAuth.createGapiOAuth2Client(
      env.GOOGLE_CALLBACK_URL_JOB,
      job.tokens.jobAccessToken,
      job.tokens.jobRefreshToken
    );

    // fusiontablesにinsert
    while(reportMessages.length > 0) {
      // batch単位に分割
      const batchSize = reportMessages.length>=REPORTS_BATCH_COUNT ?
        REPORTS_BATCH_COUNT : reportMessages.length;
      const batch = reportMessages.slice(0, batchSize);
      reportMessages.splice(0, batchSize);

      // csvの組み立て
      let csv: string = '';
      for(const aReport of batch) {
        const hash: string = getHash(aReport);
        const location: string = `${String(aReport.portal.latitude)},${String(aReport.portal.longitude)}`;
        const escapedPortalName: string = aReport.portal.name.replace(/"/g,'""');
        const ownedNumber: number = aReport.portal.owned ? 1 : 0;
        const csvLine: string =
          `"${hash}"\t${String(aReport.mailDate)}\t${location}\t"${escapedPortalName}"\t${ownedNumber}\n`;
        csv += csvLine;
      }

      // insert実行
      console.log('try to import:', csv);
      try {
        const res: any = await fusiontables.table.importRows({
          "tableId": reportTableId,
          "auth": client,
          "delimiter": '\t',
          "media": {
            "mediaType": 'application/octet-stream',
            "body": Buffer.from(csv, 'utf8')
          }
        });
        console.info(`imported: ${res.data.numRowsReceived} rows`);
      }catch(err){
        console.error(err);
      }
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



const getHash = (report: OneReportMessage): string => {

  const shasum = crypto.createHash('md5');
  return shasum
    .update(String(report.mailDate))
    .update(String(report.portal.latitude))
    .update(String(report.portal.longitude))
    .update(String(report.portal.owned))
    .digest('base64').substr(0, 22);
};
