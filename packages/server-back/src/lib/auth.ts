const env = require('@damage-report-plots/common/env');
const {google} = require('googleapis');


/**
 * gapiClientの作成
 */
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
 * accessTokenを明示的にrefresh
 * batchelor向け
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

/**
 * tokenの無効化
 */
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


