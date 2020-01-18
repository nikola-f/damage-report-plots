import {SNSEvent} from 'aws-lambda';
import {MessageList} from 'aws-sdk/clients/sqs';
import {OneReportMessage, Job} from '@common/types';

import * as util from '@common/util';
import * as launcher from '../lib/launcher';
import * as env from '../lib/env';
import * as libAuth from '../lib/auth';
import * as libQueue from '../lib/queue';
import * as libJob from '../lib/job';
import * as base64 from 'urlsafe-base64';
import * as dateFormat from 'dateformat';
import {google} from 'googleapis';
const sheets = google.sheets('v4');
import * as crypto from 'crypto';


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
    
    // dequeue reports
    let reportArrayMessages: MessageList = null;
    try {
      reportArrayMessages = await libQueue.receiveMessageBatch(job.report.queueUrl, env.REPORTS_ARRAY_DEQUEUE_COUNT);
    }catch(err){
      console.error(err);
      continue;
    }


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


    try {
      if(reportRows.length > 0) {
        const client = libAuth.createGapiOAuth2Client(
          env.GOOGLE_CALLBACK_URL,
          job.accessToken
        );
  
        console.log(`try to append ${reportRows.length} reports.`);
        const appendRes = await sheets.spreadsheets.values.append({
          "spreadsheetId": job.agent.spreadsheetId,
          "range": 'reports!A2:F2',
          "valueInputOption": 'RAW',
          // "valueInputOption": 'USER_ENTERED',
          "insertDataOption": 'INSERT_ROWS',
          "requestBody": {
            "range": 'reports!A2:F2',
            "values": reportRows
          },
          "auth": client
        });
        console.info('reports appended:', appendRes.data);
      }

    }catch(err){
      console.error(err);
      libJob.cancel(job);
      continue;
    }


    // remains at report queue, recurse
    // no remains, go postExecute
    const reportRemain: number =
      await libQueue.getNumberOfMessages(job.report.queueUrl);
    if(reportRemain > 0 && reportRows.length > 0) {
      console.log(`${reportRemain} reports remaining, recurse.`);
      await launcher.appendReportsToSheetsAsync(job);
    }else{
      await launcher.postExecuteJobAsync(job);
    }

  }
};


