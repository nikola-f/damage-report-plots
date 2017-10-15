import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {MessageList, Message} from 'aws-sdk/clients/sqs';
import {CreateTableMessage, CheckTableMessage,
  InsertReportsMessage, Agent, OneReportMessage} from './types';
// import * as ftdef from './common/ftdef.json';

import AWS = require('aws-sdk');
import gapi = require('googleapis');
import crypto = require('crypto');
import escape = require('escape-quotes');
import lc = require('./common/launcher');
import au = require('./common/auth');
import qu = require('./common/queue');
import ut = require('./common/util');
// const sqs: AWS.SQS = new AWS.SQS(),
//       dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();
const REDIRECT_URL: string = 'https://plots.run/redirect',
      FTDEFS = require('./common/ftdef.json'),
      REPORTS_COUNT: number = Number(process.env.REPORTS_COUNT),
      REPORTS_BATCH_COUNT: number = Number(process.env.REPORTS_BATCH_COUNT);


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
 * fusiontablesの存在チェック
 * 不存在ならcreateTable
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



export async function insertReports(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    let irm: InsertReportsMessage = JSON.parse(rec.Sns.Message);
    console.log('try to insert reports:' + JSON.stringify(irm.job.agent.hashedId));

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

      console.log('try to isert:' + sql);
    }


    // reportキューから削除
    // reportキューに残があれば再帰
    // 残がなければ finalizeJobへ


  }
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
