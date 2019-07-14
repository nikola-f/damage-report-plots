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
const FTDEFS = require('./ftdef.json'),
      REPORTS_COUNT: number = Number(process.env.REPORTS_COUNT),
      REPORTS_BATCH_COUNT: number = Number(process.env.REPORTS_BATCH_COUNT);


/**
 * fusionTableの作成
 * @next putAgent, queueThreads
 */
export const createTable = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const job: Job = JSON.parse(rec.Sns.Message);
    const client = libAuth.createGapiOAuth2Client(
      env.GOOGLE_CALLBACK_URL_ME,
      job.tokens.jobAccessToken,
      job.tokens.jobRefreshToken
    );

    // 並行
    let rawTableId: string, upxViewId: string;
    let agent: Agent;
    await Promise.all([

      // table作成
      (async () => {
        const insertRes = await fusiontables.table.insert({
          "resource": FTDEFS.defs.report.raw,
          "auth": client
        });
        console.info('raw table created:', insertRes);
        rawTableId = insertRes.data.tableId;
        
        // const queryRes = await fusiontables.query.sql({
        //   "sql": `CREATE VIEW upx AS (
        //             SELECT portalLocation, MAX( portalName ), SUM( portalOwned )
        //               FROM ${rawTableId}
        //             GROUP BY portalLocation
        //           )`,
        //   "auth": client
        // });
        
      })(),
      
      // agentデータ取得
      (async () => {
        agent = await libAgent.getAgent(job.openId);
        console.log('agent:', agent);
      })()
    ]);

    // agentデータ保存
    agent.reportTableId = rawTableId;
    launcher.putAgentAsync(agent);

    launcher.queueThreadsAsync({
      "job": job
    });
  }
};


/**
 * sheetsの存在チェック・不存在ならcreateSheets
 * @next createSheets, queueThreads
 */
export const checkSheetsExistence = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {

    let found: boolean = false;
    const job: Job = JSON.parse(rec.Sns.Message);
    
    // agent情報取得
    const agent = await libAgent.getAgent(job.openId);

    // spreadSheetsIdがあれば現物の存在チェック
    if(agent && agent.spreadsheetId) {
      const client = libAuth.createGapiOAuth2Client(
        env.GOOGLE_CALLBACK_URL_ME,
        job.tokens.jobAccessToken,
        job.tokens.jobRefreshToken
      );

      const res: any = await sheets.spreadsheets.get({
        "spreadsheetId": agent.spreadsheetId,
        "includeGridData": false,
        "auth": client
      });
      console.log('checked:', res);
      if(util.isSet(() => res.data.spreadsheetId)) {
        found = true;
      }
    }

    // 存在しなければcreateTable
    if(!found) {
      console.log('spreadsheetId not found, try to create');
      launcher.createSheetsAsync(job);

    // 存在すればqueueThreads
    }else{
      launcher.queueThreadsAsync({
        "job": job
      });
    }
  }
};


/**
 * reportデータの保存
 * @next insertReports, finalizeJob
 */
export const insertReports = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

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
      launcher.insertReportsAsync(job);
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
