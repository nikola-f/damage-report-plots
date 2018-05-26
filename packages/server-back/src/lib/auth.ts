// import gapi = require('googleapis');
// import googleAuth = require('google-auth-library');
const env = require('@damage-report-plots/common/env');
const {google} = require('googleapis');
// import * as gapi from 'googleapis';
// const OAuth2 = gapi.auth.OAuth2;



export const createGapiOAuth2Client = 
    (redirectUrl: string, accessToken?: string, refreshToken?: string): any => {

  if(!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw(new Error('google credential ENV not set.'))
  }
  
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUrl
  );
  if(accessToken || refreshToken) {
    oauth2Client.setCredentials({
      "access_token": accessToken,
      "refresh_token": refreshToken
    });
  }

  return oauth2Client;
};


/**
 * [refreshAccessTokenManually]
 * @param  {any}    auth [tokensセット済みのclient]
 * @return {[type]}      [description]
 */
export const refreshAccessTokenManually = 
  async (redirectUrl: string, refreshToken: string): Promise<string> => {
  console.log('try to refresh token.');

  return new Promise<string>((resolve, reject) => {
    const client = createGapiOAuth2Client(redirectUrl, null, refreshToken);
    client.refreshAccessToken((err, tokens) => {
      err ? reject(err) : resolve(tokens.access_token);
    });
  });
}


export const revokeTokens = 
        async (redirectUrl: string, accessToken: string, refreshToken: string): Promise<any> => {
  console.log('try to revoke tokens.');

  return new Promise((resolve, reject) => {
    const client = createGapiOAuth2Client(redirectUrl, accessToken, refreshToken);
    client.revokeCredentials((err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}




// export const generateRedirectURI2Refer = (oauth2Client: any): string => {
//   return oauth2Client.generateAuthUrl({
//     "access_type": "online",
//     "scope": [
//       'email',
//       'https://www.googleapis.com/auth/fusiontables.readonly'
//     ]
//   })
//   // profile, fusiontablesを読むだけのscope
// };



// export const generateRedirectURI2Update = (oauth2Client: any): string => {
//   return oauth2Client.generateAuthUrl({
//     "access_type": "offline",
//     "approval_prompt": "force",
//     "scope": [
//       'https://www.googleapis.com/auth/fusiontables',
//       'https://www.googleapis.com/auth/gmail.readonly'
//     ]
//   });
// };
