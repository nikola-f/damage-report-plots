import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {MessageList, Message} from 'aws-sdk/clients/sqs';
import {Agent, OneReportMessage, Job} from '@common/types';

import * as crypto from 'crypto';
import * as launcher from ':common/launcher';
import * as util from '@common/util';
import * as env from ':common/env';
import * as libAuth from ':common/auth';
import * as libQueue from '../lib/queue';
import * as base64 from 'urlsafe-base64';
import {google} from 'googleapis';
const dateFormat = require('dateformat');
const sheets = google.sheets('v4');


import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);


/**
 * append report data to spreadsheet
 * @next appendReportsToSheets, postExecuteJob
 */
export const appendReportsToSheets = async (event: SNSEvent): Promise<void> => {
  if(!util.isValidSNSEvent(event)) {
    return;
  }

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


    // remains at report queue, recurse
    // no remains, go postExecute
    const reportRemain: number =
      await libQueue.getNumberOfMessages(job.report.queueUrl);
    if(reportRemain > 0) {
      console.log(`${reportRemain} reports remaining, recurse.`);
      launcher.appendReportsToSheetsAsync(job);
    }else{
      launcher.finalizeJobAsync(job);
    }

  }
  return;
};


