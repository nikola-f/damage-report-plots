import {SNSEvent} from 'aws-lambda';
import {MessageList} from 'aws-sdk/clients/sqs';
import {Job, ThreadArrayMessage, QueueThreadsMessage, OneMailMessage, Portal,
  OneReportMessage, Range} from '@common/types';

import * as util from '@common/util';
import * as env from '../lib/env';
import * as launcher from '../lib/launcher';
import * as libAuth from '../lib/auth';
import * as libQueue from '../lib/queue';
import * as libRange from '../lib/range';
import * as libMail from '../lib/mail';
import * as libJob from '../lib/job';
import * as dateFormat from 'dateformat';
import {google} from 'googleapis';
const gmail = google.gmail('v1');



/**
 * get mail detail, analyze, queue for sheets
 * @next putJob, queueReports, appendReportsToSheets
 */
export const queueReports = async (event: SNSEvent): Promise<void> => {
  if(!util.isValidSNSEvent(event)) {
    return;
  }

  for(let rec of event.Records) {
    let job: Job = JSON.parse(rec.Sns.Message);
    console.info('try to queue reports:', job.openId);
    
    // dequeue threads
    let sqsMessages: MessageList = null;
    try {
      sqsMessages = await libQueue.receiveMessageBatch(job.thread.queueUrl, env.THREAD_ARRAY_DEQUEUE_COUNT);
    }catch(err){
      console.error(err);
      continue;
    }

    for(let anSqsMessage of sqsMessages) {
      const threadArrayMessage: ThreadArrayMessage = JSON.parse(anSqsMessage.Body);

      const mailArray: OneMailMessage[] =
        await libMail.getMails(job.accessToken, threadArrayMessage.ids, threadArrayMessage.range);
      
      if(mailArray && mailArray.length > 0) {
        console.info(`${mailArray.length} mails found.`);
      }else{
        console.info('no mails found.');
        continue;
      }

      // extract portal info from mail html
      const rawReportArray: OneReportMessage[] = [];
      for(let aMail of mailArray) {

        // mail html -> portal array
        const portals: Portal[] = libMail.parseHtml(aMail.body);
        for(let aPortal of portals) {
          rawReportArray.push({
            "mailDate": aMail.internalDate,
            "portal": aPortal
          });
        }
      }
      console.info(`${rawReportArray.length} portals parsed.`);
  
      // dedupe
      const dedupedReportArray: OneReportMessage[] = libMail.dedupe(rawReportArray);
      
      // filter out portals w/ incomplete properties
      const filteredReportArray: OneReportMessage[] = dedupedReportArray.filter((aReport) => {
        return aReport.portal && aReport.mailDate && aReport.portal.name &&
          aReport.portal.name !== '' &&
          aReport.portal.latitude && aReport.portal.longitude &&
          aReport.portal.owned !== null;
      });

      // queue for report
      if(filteredReportArray.length > 0) {
        await libQueue.sendMessageDivisioinBySize(job.report.queueUrl, filteredReportArray, 250*1024);
        job.report.queuedCount += filteredReportArray.length;
        console.info(`${filteredReportArray.length} reports queued.`);
      }else{
        console.info("no reports found.");
        continue;
      }

    }

    // threads remain, recurse
    // no threads or expire soon, go next;appendReports
    const threadRemain = await libQueue.getNumberOfMessages(job.thread.queueUrl);
    const runtimeRemain = job.expiredAt - 5 * 60 * 1000 - Date.now(); // 5min.
    console.info(`${threadRemain} threadArray & ${runtimeRemain} runtime remain.`);

    if(threadRemain > 0 && runtimeRemain > 0) {
      await launcher.queueReportsAsync(job);
    }else{
      await launcher.appendReportsToSheetsAsync(job);
    }

    // save job
    await launcher.putJobAsync(job);

  }

};



/**
 * list thread ids, then queue
 * @next putJob, queueThreads, queueReports
 */
export const queueThreads = async (event: SNSEvent): Promise<void> => {
  if(!util.isValidSNSEvent(event)) {
    return;
  }

  for(let rec of event.Records) {
    let qtm: QueueThreadsMessage = JSON.parse(rec.Sns.Message);

    console.info('try to queue threads:', qtm.job.openId);

    const client = libAuth.createGapiOAuth2Client(
      env.GOOGLE_CALLBACK_URL,
      qtm.job.accessToken
    );
    
    // yyyy-mm-dd
    const after = dateFormat(new Date(qtm.range.fromTime), 'isoDate'),
          before = dateFormat(new Date(qtm.range.toTime), 'isoDate');

    // list threads
    let req = {
      "auth": client,
      "userId": 'me',
      "maxResults": env.THREAD_FETCH_COUNT,
      "fields": 'threads/id,nextPageToken',
      "q": '{from:ingress-support@google.com from:ingress-support@nianticlabs.com}' +
          ' subject:"Ingress Damage Report: Entities attacked by"' +
          ' smaller:200K' +
          ` after:${after}` +
          ` before:${before}`
    };
    if(qtm.nextPageToken) {
      req['pageToken'] = qtm.nextPageToken;
    }
    let res, threads;
    try {
      console.log('try to list threads:', req);
      res = await new Promise((resolve, reject) => {
        gmail.users.threads.list(req, (err, res) => {
          err ? reject(err) : resolve(res);
        });
      });
      
      threads = 
        util.isSet(() => res.data.threads) ? res.data.threads : undefined;

    }catch(err){
      console.error(err);
      libJob.cancel(qtm.job);
      continue;
    }
    
    if(!threads || threads.length === 0) {
      console.info('no threads found.');
      console.log('res:', res);
      continue;
    }else{
      console.info(`${threads.length} threads found.`);
    }

    // queue for job.thread.queueUrl
    // const ids: string[] = [];
    const sqsMessages: MessageList = [];
    const threadArrayMessages: ThreadArrayMessage[] = [{
      "range": qtm.range,
      "ids": []
    }];

    let i: number = 0;
    for(let aThread of threads) {
      threadArrayMessages[i].ids.push(aThread.id);
      if(threadArrayMessages[i].ids.length === env.THREAD_QUEUE_ARRAY_SIZE) {
        i++;
        threadArrayMessages.push({
          "range": qtm.range,
          "ids": []
        });
      }
    }
    for(let aThreadArrayMessage of threadArrayMessages) {
      qtm.job.thread.queuedCount += aThreadArrayMessage.ids.length;
      if(aThreadArrayMessage.ids.length > 0) {
        sqsMessages.push({
          "MessageId": aThreadArrayMessage.ids[0],
          "Body": JSON.stringify(aThreadArrayMessage)
        });
      }
    }
    
    libQueue.sendMessageBatch(qtm.job.thread.queueUrl, sqsMessages);


    // has nextPageToken, threads remains => recurse
    if(util.isSet(() => res.data.nextPageToken)) {
      console.info('go next page:', res.data.nextPageToken);
      await launcher.queueThreadsAsync({
        "job": qtm.job,
        "range": qtm.range,
        "nextPageToken": res.data.nextPageToken
      });

    }else{
      libRange.done(qtm.job.ranges, qtm.range);
      // no nextPageToken, has next range => recurse w/ nextRange
      if(libRange.hasMoreRange(qtm.job.ranges)) {
        const nextRange: Range = libRange.nextRange(qtm.job.ranges);
        console.info('go next range:', nextRange);
        await launcher.queueThreadsAsync({
          "job": qtm.job,
          "range": nextRange,
        });
      
      // no nextPageToken, no next range, => go queueReports
      }else{
        await launcher.queueReportsAsync(qtm.job);
      }
    }

    // save job
    await launcher.putJobAsync(qtm.job);

  }
  return;
};
