import {QueryOutput} from 'aws-sdk/clients/dynamodb';
import {Job} from '@damage-report-plots/common/types';

import * as express from 'express';
import * as bodyParser from 'body-parser';

import * as awsXRay from 'aws-xray-sdk';
import * as awsPlain from 'aws-sdk';
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();

const api = express.Router();


api.use(bodyParser.urlencoded({"extended": true}));
api.use(bodyParser.json());


const isAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()) {
    next();
  }else{
    res.redirect('/403.html');
  }
};


// jobテーブルから降順で10件取得
const getJobs = async (req, res, next): Promise<void> => {

  let jobs: Job[] = [];
  let qo: QueryOutput;
  try {
    qo = await dynamo.query({
      "TableName": 'job',
      "ScanIndexForward": false,
      "KeyConditionExpression": 'openId = :o',
      "ExpressionAttributeValues": {
        ":o": req.user.openId
      },
      "Limit": 10
    }).promise();
    
    if(!qo.Items) {
      next();
      return Promise.resolve();
    }

    for(let item of qo.Items) {
      //TODO マッピング
      console.log('item:', item);
    }

  }catch(err){
    console.error('getJobList:', req);
    // res.json({"err": err, "req/user": req.user});
    next();
    return Promise.resolve(err);
  }

  req.jobs = jobs;
  next();
  return Promise.resolve();

};



// job一覧
api.get('/jobs',
  isAuthenticated,
  getJobs,
  (req, res) => {
    req.jobs ? res.json(req.jobs) : res.json([]);
  }
);


// job登録
api.post('/job',
  isAuthenticated,
  // checkRequest,
  (req, res) => {
    res.json({ message: 'job' });
  }
);


// 通常Map, heatMap等 URL一覧
api.get('/maps', isAuthenticated,
  (req, res) => {

    res.json(req.user);
  }
);


// 統計値
api.get('/stats', isAuthenticated,
  (req, res) => {
  //pUPV, pUPC
  //週ごとのレポート数サマリ

    res.json(req.user);
  }
);


export = api;
