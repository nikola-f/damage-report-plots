import {SNSEvent, Handler, ProxyHandler} from 'aws-lambda';
import {Session} from './types';


/**
 * Custom Authorizer として実装
 */


/**
 * 有効なsessionがあればdashboardへ なければgoogle同意画面へ
 */
// export function signin(event, context, callback): void {
export const signin: ProxyHandler = (event, context, callback) => {

};



export const saveSession: Handler = (event: SNSEvent, context, callback) => {

  if(event.Records) {
    for(const rec of  event.Records) {
      const session: Session = JSON.parse(rec.Sns.Message);

    }
  }




};
