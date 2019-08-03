import {MessageList, Message} from 'aws-sdk/clients/sqs';
import {Job, JobStatus, QueueThreadsMessage,
  OneThreadMessage,
  OneMailMessage, Portal} from ':common/types';

import * as util from ':common/util';
import * as gapi from 'googleapis';
import * as Batchelor from 'batchelor';
import * as base64 from 'base-64';
import * as utf8 from 'utf8';
import * as cheerio from 'cheerio';


const THREAD_BATCH_COUNT = Number(process.env.THREAD_BATCH_COUNT);


export const decodeBase64 = (origin: string): string => {
  // '-' -> '+' と '_' -> '/'
  const replaced = origin.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = base64.decode(replaced);
  const decoded = utf8.decode(bytes);
  return decoded;
};


export const parseHtml = (html: string): Portal[] => {

  // console.log(html);
  const $ = cheerio.load(html);

  const agentName = $('body')
                      .children('div').first()
                        .children('table').first()
                          .children('tbody').first()
                            .children('tr').eq(1)
                              .children('td').first()
                                .children('table').first()
                                  .children('tbody').first()
                                    .children('tr').first()
                                      .children('td').first()
                                        .children('span').eq(1).text();

  const portals: Portal[] = [];
  let portal: Portal = {
    "name": '',
    "latitude": 0,
    "longitude": 0,
    "owned": null
  };
  $('a[href]').each((i, element) => {
    const intelUrl = $(element).attr('href');
    // console.log(intelUrl);
    const latlong = url2latlong(intelUrl);
    portal.latitude = latlong.lat;
    portal.longitude = latlong.long;

    portal.name = $(element).parent().prev().text();
    // link destroyは無視
    if(!portal.name || portal.name === '') {
      console.log('name not found:' + JSON.stringify(portal));
      return true;
    }

    const owner = $(element).parent().parent().parent() // a -> div -> td -> tr
                    .next('tr').next('tr')
                      .find('div').eq(1)
                        .find('span');

    // console.log($(owner).html());
    if(owner) {
      portal.owned = agentName === $(owner).text();
    }else{
      portal.owned = false;
    }

    portals.push(portal);
  });

  return portals;
};




export const getMails = async (accessToken: string, threads: MessageList,
  rangeFromTime: number, rangeToTime: number): Promise<OneMailMessage[]> => {
  console.log('try to get mails.');

  const batchelor = new Batchelor({
    "uri": 'https://www.googleapis.com/batch',
    "method": 'POST',
    "auth": {
      "bearer": accessToken
    },
   	"headers": {
      "Content-Type": 'multipart/mixed'
    }
  });

  // batch用配列の作成
  let threadMessages = [];
  let mails: OneMailMessage[] = [];
  let threadGetRes;
  for(let aThread of threads) {
    const message: OneThreadMessage = JSON.parse(aThread.Body);
    threadMessages.push({
      "method": 'GET',
      "path": `https://www.googleapis.com/gmail/v1/users/me/threads/${message.id}?fields=messages/id,messages/internalDate,messages/payload/parts/body/data`
    });
  }

  // threadの詳細取得(mail付き)をバッチ実行
  while(threadMessages.length > 0) {
    // THREAD_BATCH_COUNTずつ
    const batchSize = threadMessages.length>=THREAD_BATCH_COUNT ?
      THREAD_BATCH_COUNT : threadMessages.length
    const batch = threadMessages.slice(0, batchSize);
    threadMessages.splice(0, batchSize);

    batchelor.add(batch);
    threadGetRes = await new Promise((resolve, reject) => {
      batchelor.run((err, res) => {
        err ? reject(err) : resolve(res);
      });
    });
    batchelor.reset();

    // gapiのレスポンスをOneMailMessage[]に成形
    const mailMessages = parseBatchResponse(threadGetRes);
    for(let aMessage of mailMessages) {
      // 日時チェック/gmailAPIでフィルタできるのは日付まで
      if(aMessage.internalDate < rangeFromTime ||
          aMessage.internalDate >= rangeToTime) {
        continue;
      }
      if(util.isSet(() => aMessage.payload.parts[1].body.data)) {
        mails.push({
          "id": aMessage.id,
          "internalDate": aMessage.internalDate,
          "body": aMessage.payload.parts[1].body.data
        });
      }else{
        console.error('mail body not found:' + aMessage.id);
        continue;
      }
    }
  }

  console.log(`${mails.length} mails received.`);
  return Promise.resolve(mails);
};


const parseBatchResponse = (response: any): any => {

  let messages = [];
  if(util.isSet(() => response.parts)) {
    for(let aPart of response.parts) {
      Array.prototype.push.apply(messages, aPart.body.messages);
    }
  }else if(util.isSet(() => response.body.messages)) {
    Array.prototype.push.apply(messages, response.body.messages);
  }else{
    console.error('batch response contains no message part.');
  }

  console.log(`parse batch res:${messages.length} messages found.`);
  return messages;
};


const url2latlong = (url: string): {lat: number, long: number} => {
  let result = {
    "lat": 0,
    "long": 0
  };
  result.lat = Number(url.split('pll=')[1].split('&')[0].split(',')[0]);
  result.long = Number(url.split('pll=')[1].split('&')[0].split(',')[1]);
  return result;
};


