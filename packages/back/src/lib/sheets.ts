import {Job} from '@common/types';

import * as util from '@common/util';
import * as env from './env';
import * as libAuth from './auth';
import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
const sheets = google.sheets('v4');
const SHEETS_DEF = require('./sheetsDef.json');
const SHEETS_PROTECT = require('./sheetsProtect.json');




/**
 * get lastReportTime from spreadsheets
 */
export const getLastReportTime = async (job: Job, client: OAuth2Client): Promise<number> => {

  try {
    const res = await sheets.spreadsheets.values.get({
      "spreadsheetId": job.agent.spreadsheetId,
      "range": 'lastReportTime',
      "auth": client
    });
    
    console.log('lastReportTime:', res.data.values[0][0].split(',')[0]);

    if(util.isSet(() => res.data.values[0][0]) &&
       res.data.values[0][0].match(/,/) &&
       !isNaN(res.data.values[0][0].split(',')[0])) {
      return Number(res.data.values[0][0].split(',')[0]);
    }else{
      return 0;
    }
    
  }catch(err){
    console.error(err);
    throw err;
  }

};


/**
 * create spreadsheets
 */
export const create = async (client: OAuth2Client): Promise<string> => {

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
export const exists = async (job: Job, client: OAuth2Client): Promise<boolean> => {

  if(job.agent && job.agent.spreadsheetId) {

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


