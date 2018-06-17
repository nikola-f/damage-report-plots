import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {MessageList} from 'aws-sdk/clients/sqs';
import {Job, JobStatus, QueueThreadsMessage,
  OneThreadMessage, OneMailMessage, Portal,
  OneReportMessage} from '@damage-report-plots/common/types';

const dateFormat = require('dateformat');
import * as util from '@damage-report-plots/common/util';
import * as env from '@damage-report-plots/common/env';
import * as launcher from '@damage-report-plots/common/launcher';
import * as libAuth from './lib/auth';
import * as libQueue from './lib/queue';
import * as libMail from './lib/mail';
import {google} from 'googleapis';
const gmail = google.gmail('v1');


const THREAD_COUNT: number = Number(process.env.THREAD_COUNT),
      MAIL_COUNT: number = Number(process.env.MAIL_COUNT);


/**
 * mailの解析およびreportのキューイング
 * @next putJob, parseMails, insertReports
 */
export const parseMails = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    let job: Job = JSON.parse(rec.Sns.Message);
    console.log('try to parse mails:' + JSON.stringify(job.openId));

    // mailキューからmailを取得
    const mailMessages: MessageList =
      await libQueue.receiveMessageBatch(job.mail.queueUrl, MAIL_COUNT);
    if(mailMessages.length <= 0) {
      console.log('no mails queued.');
      continue;
    }

    // ポータル情報抽出
    const reportMessages: MessageList = [];
    for(let message of mailMessages) {
      const mail: OneMailMessage = JSON.parse(message.Body);
      const html: string = libMail.decodeBase64(mail.body);
      const portals: Portal[] = libMail.parseHtml(html);

      for(let aPortal of portals) {
        const oneReportMessage: OneReportMessage = {
          "mailId": mail.id,
          "mailDate": mail.internalDate,
          "portal": aPortal
        };
        reportMessages.push({
          "MessageId": String(reportMessages.length),
          "Body": JSON.stringify(oneReportMessage)
        });
      }
    }
    console.log(JSON.stringify(reportMessages));

    // reportキューにキューイング
    const queued = await libQueue.sendMessageBatch(job.report.queueUrl, reportMessages);
    job.report.queuedCount += queued;
    console.log(`${queued} reports queued.`);

    // mailキューから削除
    const deleted =
      await libQueue.deleteMessageBatch(job.mail.queueUrl, mailMessages);
    // job.mail.queuedCount -= mailMessages.length;
    // job.mail.dequeuedCount += mailMessages.length;
    console.log(`${deleted} mails deleted.`);

    // job保存
    launcher.putJobAsync(job);

    // mailキューに残があれば再帰
    // なければinsertReportsを起動
    const mailRemain: number =
      await libQueue.getNumberOfMessages(job.mail.queueUrl);
    if(mailRemain > 0) {
      console.log(`${mailRemain} mails remaining, recurse.`);
      launcher.parseMailsAsync(job);
    }else{
      launcher.insertReportsAsync(job);
    }

  }
  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


/**
 * mailの詳細取得およびキューイング
 * @next putJob, queueMails, parseMails
 */
export const queueMails = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    let job: Job = JSON.parse(rec.Sns.Message);
    console.log('try to queue mails:' + JSON.stringify(job.openId));

    // threadキューからthreadを取得
    const threadMessages: MessageList =
      await libQueue.receiveMessageBatch(job.thread.queueUrl, THREAD_COUNT);
    if(threadMessages.length <= 0) {
      console.log('no threads queued.');
      continue;
    }

    // access_token 再作成
    const accessToken = 
      await libAuth.refreshAccessTokenManually(env.GOOGLE_CALLBACK_URL_JOB, job.tokens.jobRefreshToken);
    // gapiでthreadの詳細(mail付き)取得
    const mails: OneMailMessage[] =
      await libMail.getMails(accessToken, threadMessages,
        job.rangeFromTime, job.rangeToTime);
    if(mails && mails.length > 0) {
      console.log(`${mails.length} mails found.`);
    }else{
      console.log('no mails found.');
      continue;
    }

    // mailキューにキューイング
    const mailMessages: MessageList = [];
    for(let aMail of mails) {
      mailMessages.push({
        MessageId: aMail.id,
        Body: JSON.stringify(aMail)
      });
    }
    job.mail.queuedCount +=
      await libQueue.sendMessageBatch(job.mail.queueUrl, mailMessages);
    console.log('queued.' + JSON.stringify(job.mail));

    // threadキューから削除
    const deleted =
      await libQueue.deleteMessageBatch(job.thread.queueUrl, threadMessages);
    // job.thread.queuedCount -= threadMessages.length;
    // job.thread.dequeuedCount += threadMessages.length;
    console.log(`${deleted} threads deleted.`);

    // jobをdb保存
    job.lastAccessTime = Date.now();
    launcher.putJobAsync(job);

    // threadキューに残があれば再帰
    // なければparseMailsを起動
    const threadRemain: number =
      await libQueue.getNumberOfMessages(job.thread.queueUrl);
    if(threadRemain > 0) {
      launcher.queueMailsAsync(job);
    }else{
      launcher.parseMailsAsync(job);
    }

  }
  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


/**
 * threadのid取得およびキューイング
 * @next putJob, queueThreads, queueMails
 */
export const queueThreads = async (event: SNSEvent, context, callback): Promise<void> => {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    let qtm: QueueThreadsMessage = JSON.parse(rec.Sns.Message);

    console.log('try to queue threads:' + JSON.stringify(qtm.job.openId));

    const client = libAuth.createGapiOAuth2Client(
      env.GOOGLE_CALLBACK_URL_JOB,
      qtm.job.tokens.jobAccessToken,
      qtm.job.tokens.jobRefreshToken
    );

    // yyyy-mm-ddに変換
    const after = dateFormat(new Date(qtm.job.rangeFromTime), 'isoDate'),
          before = dateFormat(new Date(qtm.job.rangeToTime), 'isoDate');

    // gapiでthread一覧の取得
    let req = {
      "auth": client,
      "userId": 'me',
      // "maxResults": String(THREAD_COUNT),
      "maxResults": THREAD_COUNT,
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
      continue;
    }
    
    if(!threads || threads.length === 0) {
      console.log('no threads found.');
      console.log('res:', res);
      continue;
    }else{
      console.log(`${threads.length} threads found.`);
    }

    //job.thread.queueUrlにキューイング
    const messages: MessageList = [];
    for(let aThread of threads) {
      const message: OneThreadMessage = {
        id: aThread.id
      };
      messages.push({
        MessageId: aThread.id,
        Body: JSON.stringify(message)
      });
    }
    qtm.job.thread.queuedCount +=
      await libQueue.sendMessageBatch(qtm.job.thread.queueUrl, messages);

    // jobをdb保存
    launcher.putJobAsync(qtm.job);

    //残りがあればnextPageTokenが返るのでそれをsetして再帰
    //残りがなければqueueMailsを起動
    if(res.nextPageToken) {
      console.log('go recurrsive:' + res.nextPageToken);
      launcher.queueThreadsAsync({
        "job": qtm.job,
        "nextPageToken": res.nextPageToken
      });
    }else{
      launcher.queueMailsAsync(qtm.job);
    }

  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};
