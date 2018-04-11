import {QueryOutput} from 'aws-sdk/clients/dynamodb';
import {Job} from '../types';

import express = require('express');
import bodyParser = require('body-parser');

import awsXRay = require('aws-xray-sdk');
import awsPlain = require('aws-sdk');
const AWS = awsXRay.captureAWS(awsPlain);
const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();


const router = express.Router();

router.use(bodyParser.urlencoded({"extended": true}));
router.use(bodyParser.json());


const isAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()) {
    next();
  }else{
    res.redirect('/403.html');
  }
};


// jobテーブルから降順で10件取得
async function getJobs(req, res, next): Promise<void> {

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
router.get('/jobs',
  isAuthenticated,
  getJobs,
  (req, res) => {
    req.jobs ? res.json(req.jobs) : res.json([]);
  }
);


// job登録
router.post('/job', isAuthenticated,
  (req, res) => {
    res.json({ message: 'job' });
  }
);


// 通常Map, heatMap等 URL一覧
router.get('/maps', isAuthenticated,
  (req, res) => {

    res.json(req.user);
  }
);


// 統計値
router.get('/stats', isAuthenticated,
  (req, res) => {
  //pUPV, pUPC
  //週ごとのレポート数サマリ

    res.json(req.user);
  }
);


module.exports = router;
