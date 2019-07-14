import {Agent, OneReportMessage, Job} from './types';

import * as crypto from 'crypto';
import * as launcher from './launcher';
import * as util from './util';
import * as env from './env';
import * as libAgent from './agent';
// import * as libAuth from './lib/auth';
// import * as libQueue from './lib/queue';
import {google} from 'googleapis';
const fusiontables = google.fusiontables('v2');


// export const getMappedUpxCount = async (client: any, tableId: string): Promise<{mappedUpv: number, mappedUpc: number}> => {
export const getPortalSummary = async (client: any, tableId: string): Promise<{mappedUpv: number, mappedUpc: number}> => {
  
  let mappedUpv: number = 0,
      mappedUpc: number = 0;

  try {
    const queryRes = await fusiontables.query.sql({
      "auth": client,
      "sql": `SELECT portalLocation, portalName, ` +
             `MAXIMUM(portalOwned) AS owned, COUNT() AS reports, MAXIMUM(mailDate) AS last ` +
             `FROM ${tableId}  ` +
             `GROUP BY portalLocation, portalName;`
    });
    console.log('queryRes:', queryRes);
    
    if(queryRes && queryRes.data) {
      
    }
    
  }catch(err){
    console.error(err);
  }finally{
    return Promise.resolve({
      "mappedUpv": mappedUpv,
      "mappedUpc": mappedUpc
    });
  }
  
};