import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {CreateTableMessage, CheckTableMessage} from './types';
// import * as ftdef from './common/ftdef.json';

import AWS = require('aws-sdk');
import gapi = require('googleapis');
import lc = require('./common/launcher');
import au = require('./common/auth');
import qu = require('./common/queue');
import ut = require('./common/util');
// const sqs: AWS.SQS = new AWS.SQS(),
//       dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();
const REDIRECT_URL: string = 'https://plots.run/redirect',
      FTDEFS = require('./common/ftdef.json');


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
        ft.table.get(ctm.agent.reportTableId, (err, res) => {
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



export async function recordReports(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {

  }
};
