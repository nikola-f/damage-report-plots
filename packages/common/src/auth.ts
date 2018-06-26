const env = require('./env');
const {google} = require('googleapis');


/**
 * gapiClientの作成
 */
export const createGapiOAuth2Client = 
    (redirectUrl: string, accessToken?: string, refreshToken?: string): any => {

  console.info(
    'try to create client:', 
    accessToken? accessToken.substr(-4): ''
  );

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
 * accessTokenを明示的にrefresh
 * batchelor向け
 */
export const refreshAccessTokenManually = 
  async (redirectUrl: string, refreshToken: string): Promise<string> => {
  console.info('try to refresh token.');

  return new Promise<string>((resolve, reject) => {
    const client = createGapiOAuth2Client(redirectUrl, null, refreshToken);
    client.refreshAccessToken((err, tokens) => {
      err ? reject(err) : resolve(tokens.access_token);
    });
  });
}

/**
 * tokenの無効化
 */
export const revokeTokens = 
        async (redirectUrl: string, accessToken: string, refreshToken: string): Promise<any> => {
  console.info('try to revoke tokens:', accessToken.substr(-4));

  return new Promise((resolve, reject) => {
    const client = createGapiOAuth2Client(redirectUrl, accessToken, refreshToken);
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


