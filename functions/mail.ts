import {SNSEvent, Handler, ProxyResult} from 'aws-lambda';
import {GetQueueAttributesRequest, QueueAttributeName,
  GetQueueAttributesResult, SendMessageBatchRequest,
  ReceiveMessageRequest, ReceiveMessageResult,
  DeleteMessageBatchRequest, DeleteMessageBatchResult,
  CreateQueueRequest, SendMessageBatchRequestEntryList,
  SendMessageBatchResult, MessageList, Message} from 'aws-sdk/clients/sqs';
import {Job, JobStatus, QueueThreadsMessage,
  OneThreadMessage, QueueMailsMessage,
  ParseMailsMessage, OneMailMessage, Portal,
  OneReportMessage} from './types';

import AWS = require('aws-sdk');
import gapi = require('googleapis');
import dateformat = require('dateformat');
import lc = require('./common/launcher');
import au = require('./common/auth');
import qu = require('./common/queue');
import ml = require('./common/mail_');
const gmail = gapi.gmail('v1');

const REDIRECT_URL: string = 'https://plots.run/redirect',
      THREAD_COUNT: number = Number(process.env.THREAD_COUNT),
      MAIL_COUNT: number = Number(process.env.MAIL_COUNT);



export async function parseMails(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    let pmm: ParseMailsMessage = JSON.parse(rec.Sns.Message);
    console.log('try to parse mails:' + JSON.stringify(pmm.job.agent.hashedId));

    // mailキューからmailを取得
    const mailMessages: MessageList =
      await qu.receiveMessageBatch(pmm.job.mail.queueUrl, MAIL_COUNT);
    if(mailMessages.length <= 0) {
      console.log('no mails queued.');
      continue;
    }

    // ポータル情報抽出
    const reportMessages: MessageList = [];
    for(let message of mailMessages) {
      const mail: OneMailMessage = JSON.parse(message.Body);
      const html: string = ml.decodeBase64(mail.body);
      const portals: Portal[] = ml.parseHtml(html);

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
    const queued = await qu.sendMessageBatch(pmm.job.report.queueUrl, reportMessages);
    pmm.job.report.queuedCount += queued;
    console.log(`${queued} reports queued.`);

    // mailキューから削除
    const deleted =
      await qu.deleteMessageBatch(pmm.job.mail.queueUrl, mailMessages);
    pmm.job.mail.queuedCount -= mailMessages.length;
    pmm.job.mail.dequeuedCount += mailMessages.length;
    console.log(`${deleted} mails deleted.`);

    // job保存
    lc.putJobAsync(pmm.job);

    // mailキューに残があれば再帰
    // なければrecordReportsを起動
    const mailRemain: number =
      await qu.getNumberOfMessages(pmm.job.mail.queueUrl);
    if(mailRemain > 0) {
      console.log(`${mailRemain} mails remaining, recurse.`);
      lc.parseMailsAsync(pmm);
    }else{
      lc.insertReportsAsync({
        "job": pmm.job,
      })
    }

  }
  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};



export async function queueMails(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    let qmm: QueueMailsMessage = JSON.parse(rec.Sns.Message);
    console.log('try to queue mails:' + JSON.stringify(qmm.job.agent.hashedId));

    // threadキューからthreadを取得
    const threadMessages: MessageList =
      await qu.receiveMessageBatch(qmm.job.thread.queueUrl, THREAD_COUNT);
    if(threadMessages.length <= 0) {
      console.log('no threads queued.');
      continue;
    }

    // access_token 再作成
    let auth = au.createGapiOAuth2Client(REDIRECT_URL);
    auth.setCredentials(qmm.job.tokens);
    qmm.job.tokens = await au.refreshAccessTokenManually(auth);

    // gapiでthreadの詳細(mail付き)取得
    const mails: OneThreadMessage[] =
      await ml.getMails(qmm.job.tokens, threadMessages,
        qmm.job.rangeFromTime, qmm.job.rangeToTime);
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
    qmm.job.mail.queuedCount +=
      await qu.sendMessageBatch(qmm.job.mail.queueUrl, mailMessages);
    console.log('queued.' + JSON.stringify(qmm.job.mail));

    // threadキューから削除
    const deleted =
      await qu.deleteMessageBatch(qmm.job.thread.queueUrl, threadMessages);
    qmm.job.thread.queuedCount -= threadMessages.length;
    qmm.job.thread.dequeuedCount += threadMessages.length;
    console.log(`${deleted} threads deleted.`);

    // jobをdb保存
    lc.putJobAsync(qmm.job);

    // threadキューに残があれば再帰
    // なければparseMailsを起動
    let threadRemain: number =
      await qu.getNumberOfMessages(qmm.job.thread.queueUrl);
    if(threadRemain > 0) {
      lc.queueMailsAsync(qmm);
    }else{
      lc.parseMailsAsync({
        "job": qmm.job
      })
    }

  }
  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};


export async function queueThreads(event: SNSEvent, context, callback): Promise<void> {
  console.log(JSON.stringify(event));

  for(let rec of event.Records) {
    let qtm: QueueThreadsMessage = JSON.parse(rec.Sns.Message);

    console.log('try to queue threads:' + JSON.stringify(qtm.job.agent.hashedId));

    // 同意済みで既にtokensあり
    const auth = au.createGapiOAuth2Client(REDIRECT_URL);
    auth.setCredentials(qtm.job.tokens);

    // yyyy-mm-ddに変換
    const after = dateformat(new Date(qtm.job.rangeFromTime), 'isoDate'),
          before = dateformat(new Date(qtm.job.rangeToTime), 'isoDate');

    // gapiでthread一覧の取得
    let req = {
      "auth": auth,
      "userId": 'me',
      "maxResults": String(THREAD_COUNT),
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
    let res;
    try {
      res = await new Promise((resolve, reject) => {
        gmail.users.threads.list(req, (err, res) => {
          err ? reject(err) : resolve(res);
        });
      });

    }catch(err){
      console.error(err);
      continue;
    }
    if(!res.threads) {
      console.log('no threads found.');
      continue;
    }else{
      console.log(`${res.threads.length} threads found.`);
    }

    //job.thread.queueUrlにキューイング
    const messages: MessageList = [];
    for(let aThread of res.threads) {
      const message: OneThreadMessage = {
        id: aThread.id
      };
      messages.push({
        MessageId: aThread.id,
        Body: JSON.stringify(message)
      });
    }
    qtm.job.thread.queuedCount +=
      await qu.sendMessageBatch(qtm.job.thread.queueUrl, messages);

    // jobをdb保存
    lc.putJobAsync(qtm.job);

    //残りがあればnextPageTokenが返るのでそれをsetして再帰
    //残りがなければqueueMailsを起動
    if(res.nextPageToken) {
      console.log('go recurrsive:' + res.nextPageToken);
      lc.queueThreadsAsync({
        "job": qtm.job,
        "nextPageToken": res.nextPageToken
      });
    }else{
      lc.queueMailsAsync({
        "job": qtm.job
      })
    }

  }

  callback(null, {
    "statusCode": 200,
    "body": {}
  });
};
