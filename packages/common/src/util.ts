import {SNSEvent, Handler, ProxyResult, APIGatewayProxyEvent} from 'aws-lambda';
const unique = require('make-unique');



/**
 * httpProxyオブジェクトの存在チェックと終了
 */
export const validateProxyEvent = (event: APIGatewayProxyEvent, callback) => {
  console.log(JSON.stringify(event));
  
  if(event && event.headers && event.httpMethod) {
    switch(event.httpMethod) {
      case 'POST':
        if(event.body) {
          return;
        }
        break;
    }
  }
  
  callback(null, {
    "statusCode": 400,
    "body": 'Bad Request'
  })
};

/**
 * SNSオブジェクトの存在チェックと終了
 */
export const validateSnsEvent = (event: SNSEvent, callback) => {
  console.log(JSON.stringify(event));

  if(event && event.Records && event.Records.length && event.Records.length > 0) {
    return;
  }else{
    callback(null, {
      "statusCode": 400,
      "body": 'Bad Request'
    });
  }
  
};


/**
 * 階層オブジェクトの存在チェック
 * @param  {Function} fn [description]
 * @return {boolean}     [description]
 */
export const isSet = (fn): boolean => {
  let value;
  try {
    value = fn();
  }catch(err){
    value = undefined;
  }finally{
    return value !== undefined;
  }
};


/**
 * epoch time(ms)をISO形式日付文字列へ
 */
export const toString = (ms: number): string => {
  return (new Date(ms)).toISOString();
};


/**
 * 配列から重複削除
 */
export const dedupe = (list: Array<any>): Array<any> => {
  const result: Array<any> = unique(
    list,
    (a, b) => {
      return JSON.stringify(a) === JSON.stringify(b);
    }
  );
  
  if(list.length > result.length) {
    console.log(`Array deduped ${list.length} to ${result.length}.`);
  }
  
  return result;
};


/**
 * 文字列表現時のバイト数を返す(UTF-8)
 */
export const getSizeInBytes = (object: any): number => {
  return encodeURIComponent(JSON.stringify(object)).replace(/%../g,"x").length;
};
