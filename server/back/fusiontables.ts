import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {MessageList, Message} from 'aws-sdk/clients/sqs';
import {CreateTableMessage, CheckTableMessage,
  InsertReportsMessage, Agent, OneReportMessage} from '../sub/types';

import * as crypto from 'crypto';
import * as escape from 'escape-quotes';
import * as lc from '../sub/launcher';
import * as ut from '../sub/util';
import * as au from '../sub/_auth';
import * as qu from '../sub/_queue';
const gapi = require('googleapis');
const REDIRECT_URL: string = 'https://plots.run/redirect', //FIXME
      FTDEFS = require('../sub/ftdef.json'),
      REPORTS_COUNT: number = Number(process.env.REPORTS_COUNT),
      REPORTS_BATCH_COUNT: number = Number(process.env.REPORTS_BATCH_COUNT);


/**
 * fusionTableの作成
 * @next putAgent
 */
export async function createTable(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    const ctm: CreateTableMessage = JSON.parse(rec.Sns.Message);
    const auth = au.createGapiOAuth2Client(REDIRECT_URL)
    auth.setCredentials(ctm.tokens);

    // table作成
    const ft = gapi.fusiontables({
      "version": 'v2',
      "auth": auth
    });
    const res: any = await new Promise((resolve, reject) => {
      ft.table.insert(FTDEFS.defs.report, (err, res) => {
        err ? reject(err) : resolve(res);
      });
    });

    // agentデータ保存
    console.log('created:' + JSON.stringify(res));
    ctm.agent.reportTableId = res.tableId;
    lc.putAgentAsync(ctm.agent);
  }
};


/**
 * fusiontableの存在チェック
 * @next createTable
 */
export async function checkTable(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {

    let notFound: boolean;
    const ctm: CheckTableMessage = JSON.parse(rec.Sns.Message);

    if(ut.isSet(() => ctm.agent.reportTableId)) {
      const auth = au.createGapiOAuth2Client(REDIRECT_URL)
      auth.setCredentials(ctm.tokens);

      // fusiontablesの存在チェック(項目はチェックしない)
      const ft = gapi.fusiontables({
        "version": 'v2',
        "auth": auth
      });
      const res: any = await new Promise((resolve, reject) => {
        ft.table.get(
          {"tableId": ctm.agent.reportTableId},
          (err, res) => {
            err ? reject(err) : resolve(res);
          });
      })
      console.log('checked:' + JSON.stringify(res));
      if(res.tableId) {
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
      lc.createTableAsync({
        "agent": ctm.agent,
        "tokens": ctm.tokens
      });
    }
  }
};


/**
 * reportデータの保存
 * @next insertReports, finalizeJob
 */
export async function insertReports(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    let irm: InsertReportsMessage = JSON.parse(rec.Sns.Message);
    console.log('try to insert reports:' + JSON.stringify(irm.job.agent.openId));

    // reportキューからreportを取得
    const queuedMessages: MessageList =
      await qu.receiveMessageBatch(irm.job.report.queueUrl, REPORTS_COUNT);
    if(queuedMessages.length <= 0) {
      console.log('no reports queued.');
      continue;
    }
    const reportMessages: OneReportMessage[] = [];
    for(const aMessage of queuedMessages) {
      const aReport: OneReportMessage = JSON.parse(aMessage.Body);
      reportMessages.push(aReport);
    }

    // fusiontablesにinsert
    const auth = au.createGapiOAuth2Client(REDIRECT_URL)
    auth.setCredentials(irm.job.tokens);
    const ft = gapi.fusiontables({
      "version": 'v2',
      "auth": auth
    });
    while(reportMessages.length > 0) {
      // batch単位に分割
      const batchSize = reportMessages.length>=REPORTS_BATCH_COUNT ?
        REPORTS_BATCH_COUNT : reportMessages.length;
      const batch = reportMessages.slice(0, batchSize);
      reportMessages.splice(0, batchSize);

      // insert文の組み立て
      const tableId: string = irm.job.agent.reportTableId;
      let sql: string = '';
      for(const aReport of batch) {
        const hash: string = getHash(aReport);
        const location: string = `${String(aReport.portal.latitude)},${String(aReport.portal.longitude)}`;
        const ownedNumber: number = aReport.portal.owned ? 1 : 0;
        const anInsert: string =
          `INSERT INTO ${tableId} (hash, mailId, mailDate, portalLocation, portalName, portalOwned) ` +
          'VALUES (' +
            `'${hash}', '${escape(aReport.mailId)}', ${String(aReport.mailDate)}, ` +
            `'${location}', '${escape(aReport.portal.name)}', ${ownedNumber}` +
          ');';
        sql += anInsert;
      }

      // insert実行
      console.log('try to insert:' + sql);
      const res: any = await new Promise((resolve, reject) => {
        ft.query.sql(
          {"sql": sql},
          (err, res) => {
            err ? reject(err) : resolve(res);
          });
      })
      console.log('inserted:' + JSON.stringify(res));
    }

    // reportキューから削除
    const deleted =
      await qu.deleteMessageBatch(irm.job.report.queueUrl, queuedMessages);
    irm.job.report.queuedCount -= queuedMessages.length;
    irm.job.report.dequeuedCount += queuedMessages.length;
    console.log(`${deleted} reports deleted.`);

    // reportキューに残があれば再帰
    // 残がなければ finalizeJobへ
    const reportRemain: number =
      await qu.getNumberOfMessages(irm.job.report.queueUrl);
    if(reportRemain > 0) {
      console.log(`${reportRemain} reports remaining, recurse.`);
      lc.insertReportsAsync(irm);
    }else{
      lc.finalizeJobAsync(irm.job);
    }

  }
  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};



function getHash(report: OneReportMessage): string {

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
