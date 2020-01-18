import * as env from '../lib/env';
import {google} from 'googleapis';

import {OAuth2Client} from 'google-auth-library';
const authClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);



/**
 * validate jwt
 */
export const verifyIdToken = async (token: string): Promise<Object> => {
  
  try {
    const ticket = await authClient.verifyIdToken({
      "idToken": token,
      "audience": env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    return Promise.resolve(payload);
  }catch(err){
    return Promise.reject(err);
  }

};



/**
 * create gapiClient
 */
export const createGapiOAuth2Client = 
    (redirectUrl: string, accessToken?: string): OAuth2Client => {

  console.info(
    'try to create client:', 
    accessToken? accessToken.substr(-4): ''
  );

  if(!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw(new Error('google credential ENV not set.'))
  }
  
  const oauth2Client: OAuth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUrl
  );
  if(accessToken) {
    oauth2Client.setCredentials({
      "access_token": accessToken
      // "refresh_token": refreshToken
    });
  }

  return oauth2Client;
};



/**
 * revoke
 */
export const revokeToken = 
        async (redirectUrl: string, accessToken: string): Promise<any> => {
  console.info('try to revoke tokens:', accessToken.substr(-4));

  return new Promise((resolve, reject) => {
    const client = createGapiOAuth2Client(redirectUrl, accessToken);
    client.revokeCredentials((err, res) => {
      if(err) {
        console.error(err);
        reject(err);
      }else{
        console.info('revoked:', res);
        resolve(res);
      }
    });
  });
}


