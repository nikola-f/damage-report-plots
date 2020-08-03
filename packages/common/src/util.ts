import {SNSEvent, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
const unique = require('make-unique');


export const BAD_REQUEST: APIGatewayProxyResult = {
  "statusCode": 400,
  "body": 'bad request'
};

export const UNAUTHORIZED: APIGatewayProxyResult = {
  "statusCode": 401,
  "body": 'unauthorized'
};

export const OK: APIGatewayProxyResult = {
  "statusCode": 200,
  "body": 'ok'
};



/**
 * check APIGatewayProxyEvent
 */
export const isValidAPIGatewayProxyEvent = (event: APIGatewayProxyEvent): boolean => {
  console.log(JSON.stringify(event));
  
  if(event && event.headers && event.httpMethod) {
    switch(event.httpMethod) {
      case 'POST':
        return true;
      case 'GET':
        if(!event.body) {
          return true;
        }
        break;
    }
  }
  return false;
};


/**
 * check SNSEvent
 */
export const isValidSNSEvent = (event: SNSEvent): boolean => {
  console.log(JSON.stringify(event));

  if(event && event.Records && event.Records.length && event.Records.length > 0) {
    return true;
  }
  return false;
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
