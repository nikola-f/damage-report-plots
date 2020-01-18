// import {MessageList, Message} from 'aws-sdk/clients/sqs';
import {OneMailMessage, Portal, Range, OneReportMessage} from '@common/types';

import * as util from '@common/util';
import * as env from './env';
import * as Batchelor from 'batchelor';
import * as base64 from 'urlsafe-base64';
import * as cheerio from 'cheerio';
import * as dateFormat from 'dateformat';



/**
 * dedupe report
 */
export const dedupe = (rawArray: OneReportMessage[]): OneReportMessage[] => {
  
  const dedupedMap = new Map();
  for(let aMessage of rawArray) {
    const key = JSON.stringify({
      "lat": aMessage.portal.latitude,
      "lng": aMessage.portal.longitude,
      "rounded": Math.floor(aMessage.mailDate /(1000*3600*24)) // round down 24hrs
    });
    
    if(dedupedMap.has(key)) {
      const value: OneReportMessage = dedupedMap.get(key);
      if(aMessage.portal.owned && !value.portal.owned ||
            aMessage.mailDate > value.mailDate) {
        // overwrite when newer mailDate or owned changes true
        dedupedMap.set(key, {
          "mailDate": aMessage.mailDate > value.mailDate ? aMessage.mailDate : value.mailDate,
          "portal": {
            "name": value.portal.name,
            "latitude": value.portal.latitude,
            "longitude": value.portal.longitude,
            "owned": aMessage.portal.owned || value.portal.owned
          }
        });
      }

    }else{
      dedupedMap.set(key, aMessage);
    }
  };

  return Array.from(dedupedMap.values());
};


/**
 * estimate mail (NOT thread) count in each range
 */
export const filterRanges = async (accessToken: string, ranges: Range[]): Promise<Range[]> => {

  const batchelor = new Batchelor({
    "uri": 'https://www.googleapis.com/batch/gmail/v1',
    "method": 'POST',
    "auth": {
      "bearer": accessToken
    },
   	"headers": {
      "Content-Type": 'multipart/mixed'
    }
  });
  console.log('ranges:', ranges);

  for(let aRange of ranges) {
    const after = dateFormat(new Date(aRange.fromTime), 'isoDate'),
          before = dateFormat(new Date(aRange.toTime), 'isoDate');
    
    const params = {
      "fields": 'resultSizeEstimate',
      "maxResults": '1',
      "q": '{from:ingress-support@google.com from:ingress-support@nianticlabs.com}' +
        ' subject:"Ingress Damage Report: Entities attacked by"' +
        ' smaller:200K' +
        ` after:${after}` +
        ` before:${before}`
    };

    batchelor.add({
      "method": 'GET',
      "path": 'https://www.googleapis.com/gmail/v1/users/me/messages?' +
        (new URLSearchParams(params)).toString()
    });
  }
  // console.log('batch:', batchelor);
  
  const res: any = await new Promise((resolve, reject) => {
    batchelor.run((err, res) => {
      if(err) {
        console.error('error:', err);
        reject(err);
      }else{
        console.log('res:', res);
        resolve(res);
      }
    });
  });
  
  if(!res.parts) {
    throw new Error('no message.');
  }

  const filtered: Range[] = []; 
  for(let i=0; i<ranges.length; i++) {
    if(util.isSet(() => res.parts[i].body.resultSizeEstimate) &&
        res.parts[i].body.resultSizeEstimate > 0) {
      filtered.push(ranges[i]);
    }
  }

  console.log(filtered);
  return filtered;
};



export const decodeBase64 = (origin: string): string => {
  const bytes = base64.decode(origin);
  const decoded = bytes.toString('utf-8');
  return decoded;
};


export const parseHtml = (html: string): Portal[] => {

  // console.log('html:', html);
  
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
  $('a[href]').each((i, element) => {
    
    // destroy link, maybe
    if(!$(element).parent().is('div')) {
      return true;
    }

    const intelUrl = $(element).attr('href');
    // console.log(intelUrl);
    const latlong = url2latlong(intelUrl);

    const name = $(element).parent().prev().text().replace(/\r?\n/g, '');
    if(!name || name === '') {
      console.log('name not found:', html);
      return true;
    }

    const owner = $(element).parent().parent().parent() // a -> div -> td -> tr
                    .next('tr').next('tr')
                      .find('div').eq(1)
                        .find('span');

    // console.log($(owner).html());
    let owned = false;
    if(owner) {
      owned = agentName === $(owner).text();
    }

    portals.push({
      "name": name,
      "latitude": latlong.lat,
      "longitude": latlong.long,
      "owned": owned
    });
  });

  return portals;
};




// export const getMails = async (accessToken: string, threadIds: string[],
//   rangeFromTime: number, rangeToTime: number): Promise<OneMailMessage[]> => {
export const getMails = async (accessToken: string, threadIds: string[], range: Range): Promise<OneMailMessage[]> => {
  console.log('try to get mails.');

  const batchelor = new Batchelor({
    "uri": 'https://www.googleapis.com/batch/gmail/v1',
    "method": 'POST',
    "auth": {
      "bearer": accessToken
    },
   	"headers": {
      "Content-Type": 'multipart/mixed'
    }
  });

  // batch用配列の作成
  const threadMessages = [];
  const mails: OneMailMessage[] = [];
  let threadGetRes;
  for(let aThreadId of threadIds) {
    // const message: OneThreadMessage = JSON.parse(aThread.Body);
    threadMessages.push({
      "method": 'GET',
      "path": `https://www.googleapis.com/gmail/v1/users/me/threads/${aThreadId}?fields=messages/id,messages/internalDate,messages/payload/parts/body/data`
    });
  }

  // threadの詳細取得(mail付き)をバッチ実行
  while(threadMessages.length > 0) {
    // THREAD_FETCH_COUNTずつ
    const batchSize = threadMessages.length>=env.THREAD_FETCH_COUNT ?
      env.THREAD_FETCH_COUNT : threadMessages.length
    const batch = threadMessages.slice(0, batchSize);
    threadMessages.splice(0, batchSize);

    batchelor.add(batch);
    threadGetRes = await new Promise((resolve, reject) => {
      batchelor.run((err, res) => {
        if(err) {
          console.info(err);
          reject(err);
        }else{
          resolve(res);
        }
      });
    });
    batchelor.reset();

    // gapiのレスポンスをOneMailMessage[]に成形
    const mailMessages = parseBatchResponse(threadGetRes);
    for(let aMessage of mailMessages) {
      // 日時チェック/gmailAPIでフィルタできるのは日付まで
      if(aMessage.internalDate < range.fromTime ||
          aMessage.internalDate >= range.toTime) {
        continue;
      }
      if(util.isSet(() => aMessage.payload.parts[1].body.data)) {
        // base64デコード
        const decodedBody = decodeBase64(aMessage.payload.parts[1].body.data);
        mails.push({
          "id": aMessage.id,
          "internalDate": aMessage.internalDate,
          "body": decodedBody
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

  // console.log(`parse batch res:${messages.length} messages found.`);
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
