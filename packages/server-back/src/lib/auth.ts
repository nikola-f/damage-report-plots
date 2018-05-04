// import gapi = require('googleapis');
// import googleAuth = require('google-auth-library');
const {gapi} = require('googleapis');
// import * as gapi from 'googleapis';
// const OAuth2 = gapi.auth.OAuth2;

// const oauth2 = gapi.auth.OAuth2;


export const createGapiOAuth2Client = (redirectUrl: string): any => {
  // if(!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  //   throw(new Error('google credential ENV not set.'))
  // }
  // // const auth = new googleAuth();
  // return new OAuth2(
  //   process.env.GOOGLE_CLIENT_ID,
  //   process.env.GOOGLE_CLIENT_SECRET,
  //   redirectUrl
  // );
};


/**
 * [refreshAccessTokenManually]
 * @param  {any}    auth [tokensセット済みのclient]
 * @return {[type]}      [description]
 */
export const refreshAccessTokenManually = async (auth: any): Promise<any> => {
  console.log('try to refresh tokens.');

  return new Promise((resolve, reject) => {
    auth.refreshAccessToken((err, tokens) => {
      err ? reject(err) : resolve(tokens);
    });
  });
}


export const revokeTokens = async (auth: any): Promise<any> => {
  console.log('try to revoke tokens.');

  return new Promise((resolve, reject) => {
    auth.revokeCredentials((err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}




export const generateRedirectURI2Refer = (oauth2Client: any): string => {
  return oauth2Client.generateAuthUrl({
    "access_type": "online",
    "scope": [
      'email',
      'https://www.googleapis.com/auth/fusiontables.readonly'
    ]
  })
  // profile, fusiontablesを読むだけのscope
};



export const generateRedirectURI2Update = (oauth2Client: any): string => {
  return oauth2Client.generateAuthUrl({
    "access_type": "offline",
    "approval_prompt": "force",
    "scope": [
      'https://www.googleapis.com/auth/fusiontables',
      'https://www.googleapis.com/auth/gmail.readonly'
    ]
  });
};
