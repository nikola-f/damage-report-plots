import {Job} from '@common/types';

import * as util from '@common/util';
import * as env from './env';
import * as libAuth from './auth';
import {google} from 'googleapis';
const sheets = google.sheets('v4');
const SHEETS_DEF = require('./sheetsDef.json');
const SHEETS_PROTECT = require('./sheetsProtect.json');


// import * as awsXRay from 'aws-xray-sdk';
// import * as awsPlain from 'aws-sdk';
// const AWS = awsXRay.captureAWS(awsPlain);


/**
 * create spreadsheets
 */
export const create = async (job: Job): Promise<string> => {

  const client = libAuth.createGapiOAuth2Client(
    env.GOOGLE_CALLBACK_URL_JOB,
    job.accessToken
  );

  let spreadsheetId: string;
  try {
    const createRes = await sheets.spreadsheets.create({
      "requestBody": SHEETS_DEF,
      "auth": client
    });
    console.info('raw sheets created:', createRes.data);
    spreadsheetId = createRes.data.spreadsheetId;
    
    const protectRes = await sheets.spreadsheets.batchUpdate({
      "spreadsheetId": spreadsheetId,
      "requestBody": SHEETS_PROTECT,
      "auth": client
    });
    
    return spreadsheetId;
  }catch(err){
    console.error('raw sheets cannot create:', err);
    throw err;
  }

};


/**
 * check exists spreadsheets
 */
export const exists = async (job: Job): Promise<boolean> => {

  if(job.agent && job.agent.spreadsheetId) {
    const client = libAuth.createGapiOAuth2Client(
      env.GOOGLE_CALLBACK_URL_JOB,
      job.accessToken
      // job.tokens.jobAccessToken,
      // job.tokens.jobRefreshToken
    );

    try {
      const res: any = await sheets.spreadsheets.get({
        "spreadsheetId": job.agent.spreadsheetId,
        "includeGridData": false,
        "auth": client
      });
      console.log('checked:', res.data);
      if(util.isSet(() => res.data.spreadsheetId)) {
        console.log('spreadsheet found');
        return true;
      }
    }catch(err){
      console.error(err);
      // error except 404 occurs, throw
      if(!util.isSet(() => err.response.status) || 
          err.response.status !== 404) {
        throw err;
      }
    }
  }

  console.log('spreadsheet not found.');
  return false;

};


