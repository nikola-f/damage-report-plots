import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {MessageList, Message} from 'aws-sdk/clients/sqs';
import {Agent, OneReportMessage, Job} from '@damage-report-plots/common/types';

import * as crypto from 'crypto';
import * as escape from 'escape-quotes';
import * as launcher from '@damage-report-plots/common/launcher';
import * as util from '@damage-report-plots/common/util';
import * as env from '@damage-report-plots/common/env';
import * as libAgent from '@damage-report-plots/common/agent';
import * as libAuth from './lib/auth';
import * as libQueue from './lib/queue';
import {google} from 'googleapis';
const fusiontables = google.fusiontables('v2');
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
    let insertRes: any; 
    let agent: Agent;
    await Promise.all([

      // table作成
      (async () => {
        insertRes = await fusiontables.table.insert({
          "resource": FTDEFS.defs.report.resource,
          "auth": client
        });
        console.log('created:', insertRes);
      })(),
      
      // agentデータ取得
      (async () => {
        agent = await libAgent.getAgent(job.openId);
        console.log('agent:', agent);
      })()
    ]);

    // agentデータ保存
    agent.reportTableId = insertRes.data.tableId;
    launcher.putAgentAsync(agent);
    
    launcher.queueThreadsAsync({
      "job": job
    });
  }
};


/**
 * fusiontableの存在チェック・不存在ならcreateTable
 * @next createTable, queueThreads
 */
export const checkTable = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {

    let notFound: boolean;
    const job: Job = JSON.parse(rec.Sns.Message);
    
    // agent情報取得
    const agent = await libAgent.getAgent(job.openId);

    // reportTableIdがあれば現物の存在チェック
    if(agent && agent.reportTableId) {
      const client = libAuth.createGapiOAuth2Client(
        env.GOOGLE_CALLBACK_URL_ME,
        job.tokens.jobAccessToken,
        job.tokens.jobRefreshToken
      );

      // const ft = google.fusiontables({
      //   "version": 'v2',
      //   "auth": client
      // });
      const res: any = await fusiontables.table.get({
        "tableId": agent.reportTableId,
        "auth": client
      });
      console.log('checked:', res);
      if(util.isSet(() => res.data.tableId)) {
        notFound = false;
      }else{
        notFound = true;
      }
    }else{
      notFound = true;
    }

    // 存在しなければcreateTable
    if(notFound) {
      console.log('tableId not found, try to create');
      launcher.createTableAsync(job);

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
      continue;
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
    // client.setCredentials(irm.job.tokens);
    // const ft = google.fusiontables({
    //   "version": 'v2',
    //   "auth": client
    // });

    // fusiontablesにinsert
    while(reportMessages.length > 0) {
      // batch単位に分割
      const batchSize = reportMessages.length>=REPORTS_BATCH_COUNT ?
        REPORTS_BATCH_COUNT : reportMessages.length;
      const batch = reportMessages.slice(0, batchSize);
      reportMessages.splice(0, batchSize);

      // insert文の組み立て
      // const tableId: string = agent.reportTableId;
      let sql: string = '';
      for(const aReport of batch) {
        const hash: string = getHash(aReport);
        const location: string = `${String(aReport.portal.latitude)},${String(aReport.portal.longitude)}`;
        const ownedNumber: number = aReport.portal.owned ? 1 : 0;
        const anInsert: string =
          `INSERT INTO ${reportTableId} (hash, mailId, mailDate, portalLocation, portalName, portalOwned) ` +
          'VALUES (' +
            `'${hash}', '${escape(aReport.mailId)}', ${String(aReport.mailDate)}, ` +
            `'${location}', '${escape(aReport.portal.name)}', ${ownedNumber}` +
          ');';
        sql += anInsert;
      }

      // insert実行
      console.log('try to insert:' + sql);
      // const res: any = await new Promise((resolve, reject) => {
      //   fusiontables.query.sql(
      //     {"sql": sql},
      //     (err, res) => {
      //       err ? reject(err) : resolve(res);
      //     });
      // })
      const res: any = await fusiontables.query.sql({
        "sql": sql,
        "auth": client
      })
      console.log('inserted:', res);
    }

    // reportキューから削除
    const deleted =
      await libQueue.deleteMessageBatch(job.report.queueUrl, queuedMessages);
    job.report.queuedCount -= queuedMessages.length;
    job.report.dequeuedCount += queuedMessages.length;
    console.log(`${deleted} reports deleted.`);

    // reportキューに残があれば再帰
    // 残がなければ finalizeJobへ
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
    .update(report.mailId)
    .update(String(report.mailDate))
    .update(String(report.portal.latitude))
    .update(String(report.portal.longitude))
    // .update(report.portal.name)
    .update(String(report.portal.owned))
    .digest('hex');
};
