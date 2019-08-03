import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {MessageList} from 'aws-sdk/clients/sqs';
import {Job, JobStatus, QueueThreadsMessage,
  ThreadArrayMessage, OneMailMessage, Portal,
  OneReportMessage} from ':common/types';

const dateFormat = require('dateformat');
import * as util from ':common/util';
import * as env from ':common/env';
import * as launcher from ':common/launcher';
import * as libAuth from ':common/auth';
import * as libQueue from './lib/queue';
import * as libMail from './lib/mail';
import {google} from 'googleapis';
const gmail = google.gmail('v1');


const THREAD_FETCH_COUNT: number = Number(process.env.THREAD_FETCH_COUNT),
      THREAD_QUEUE_ARRAY_SIZE: number = Number(process.env.THREAD_QUEUE_ARRAY_SIZE),
      MAIL_COUNT: number = Number(process.env.MAIL_COUNT);


/**
 * mailの解析およびreportのキューイング
 * @next putJob, parseMails, appendReportsToSheets
 */
export const parseMails = async (event: SNSEvent, context, callback): Promise<void> => {
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {
    let job: Job = JSON.parse(rec.Sns.Message);
    console.info('try to parse mails:', job.openId);

    // mailキューからmailを取得
    const mailMessages: MessageList =
      await libQueue.receiveMessageBatch(job.mail.queueUrl, MAIL_COUNT);
    if(mailMessages.length <= 0) {
      console.info('no mails queued.');
    }

    // ポータル情報抽出
    let rawReportMessages: Array<OneReportMessage> = [];
    const dedupedReportMessages: MessageList = [];
    for(let message of mailMessages) {
      const mail: OneMailMessage = JSON.parse(message.Body);
      const html: string = libMail.decodeBase64(mail.body);
      const portals: Portal[] = libMail.parseHtml(html);

      for(let aPortal of portals) {
        const oneReportMessage: OneReportMessage = {
          // "mailId": mail.id,
          // 1時間単位に丸める
          "mailDate": Math.floor(mail.internalDate / (1000 * 3600)) * 3600,
          "portal": aPortal
        };
        rawReportMessages.push(oneReportMessage);
      }
    }
    
    // 重複削除
    rawReportMessages = util.dedupe(rawReportMessages);
    for(let oneReportMessage of rawReportMessages) {
      dedupedReportMessages.push({
        "MessageId": String(dedupedReportMessages.length),
        "Body": JSON.stringify(oneReportMessage)
      });
    }

    // reportキューにキューイング
    if(dedupedReportMessages.length > 0) {
      const queued = await libQueue.sendMessageBatch(job.report.queueUrl, dedupedReportMessages);
      job.report.queuedCount += queued;
      console.info(`${queued} reports queued.`);
    }

    // job保存
    launcher.putJobAsync(job);

    // mailキューに残があれば再帰
    // なければinsertReportsを起動
    const mailRemain: number =
      await libQueue.getNumberOfMessages(job.mail.queueUrl);
    if(mailRemain > 0) {
      console.info(`${mailRemain} mails remaining, recurse.`);
      launcher.parseMailsAsync(job);
    }else{
      launcher.appendReportsToSheetsAsync(job);
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
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {
    let job: Job = JSON.parse(rec.Sns.Message);
    console.info('try to queue mails:', job.openId);

    // threadキューからthreadを取得
    const threadMessages: MessageList =
      await libQueue.receiveMessageBatch(job.thread.queueUrl, THREAD_FETCH_COUNT); //FIXME
    if(threadMessages.length > 0) {
      // access_token 再作成
      const accessToken = 
        await libAuth.refreshAccessTokenManually(env.GOOGLE_CALLBACK_URL_JOB, job.tokens.jobRefreshToken);
      // gapiでthreadの詳細(mail付き)取得
      const mails: OneMailMessage[] =
        await libMail.getMails(accessToken, threadMessages,
          job.rangeFromTime, job.rangeToTime);
      if(mails && mails.length > 0) {
        console.info(`${mails.length} mails found.`);
      }else{
        console.info('no mails found.');
      }
      
      // mailキューにキューイング
      const mailMessages: MessageList = [];
      for(let aMail of mails) {
        mailMessages.push({
          MessageId: aMail.id,
          Body: JSON.stringify(aMail)
        });
      }
      if(mailMessages.length > 0) {
        job.mail.queuedCount +=
          await libQueue.sendMessageBatch(job.mail.queueUrl, mailMessages);
        console.info(`${mailMessages.length} mails queued.`);
      }

    }else{
      console.info('no threads queued.');
    }

    // jobをdb保存
    job.lastAccessTime = Date.now();
    launcher.putJobAsync(job);

    // threadキューに残があれば再帰
    // なければparseMailsを起動
    const threadRemain: number =
      await libQueue.getNumberOfMessages(job.thread.queueUrl);
    console.info(`${threadRemain} threads remain.`);
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
  util.validateSnsEvent(event, callback);

  for(let rec of event.Records) {
    let qtm: QueueThreadsMessage = JSON.parse(rec.Sns.Message);

    console.info('try to queue threads:', qtm.job.openId);

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
      "maxResults": THREAD_FETCH_COUNT,
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
      console.info('no threads found.');
      console.log('res:', res);
      continue;
    }else{
      console.info(`${threads.length} threads found.`);
    }

    //job.thread.queueUrlにキューイング
    const ids: string[] = [];
    const messages: MessageList = [];

    for(let aThread of threads) {
      ids.push(aThread.id);
      if(ids.length >= THREAD_QUEUE_ARRAY_SIZE) {
        messages.push({
          "MessageId": ids[0],
          "Body": JSON.stringify(ids)
        });
        qtm.job.thread.queuedCount += ids.length;
        ids.length = 0;
      }
    }
    if(ids.length > 0) {
      messages.push({
        "MessageId": ids[0],
        "Body": JSON.stringify(ids)
      });
      qtm.job.thread.queuedCount += ids.length;
    }
    libQueue.sendMessageBatch(qtm.job.thread.queueUrl, messages);

    // jobをdb保存
    launcher.putJobAsync(qtm.job);

    //残りがあればnextPageTokenが返るのでそれをsetして再帰
    //残りがなければqueueMailsを起動
    if(util.isSet(() => res.data.nextPageToken)) {
      console.info('go recurrsive:', res.data.nextPageToken);
      launcher.queueThreadsAsync({
        "job": qtm.job,
        "nextPageToken": res.data.nextPageToken
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
