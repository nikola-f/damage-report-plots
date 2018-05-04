// import {QueryOutput} from 'aws-sdk/clients/dynamodb';
import {Job, CreateJobMessage} from '@damage-report-plots/common/types';

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

// const awsXRay = require('aws-xray-sdk');
// const awsPlain = require('aws-sdk');
// const AWS = awsXRay.captureAWS(awsPlain);
// const dynamo: AWS.DynamoDB.DocumentClient =  new AWS.DynamoDB.DocumentClient();

const libJob = require('@damage-report-plots/common/job');

const api = express.Router();


api.use(bodyParser.urlencoded({"extended": true}));
api.use(bodyParser.json());


const isAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()) {
    next();
  }else{
    res.redirect('/401.html');
  }
};


const getJobs = async (req, res, next): Promise<void> => {

  const jobs: Job[] = await libJob.getJobList(req.user.openId);

  req.jobs = jobs;
  next();
  return Promise.resolve();
};



const checkCreateJobMessage = async (req, res, next): Promise<void> => {

  let isValid: boolean = false;

  if(req.user) {
    const cjm: CreateJobMessage = req.body;
    isValid = await libJob.validateCreateMessage(cjm, req.user);
  }

  isValid ? next(): res.redirect('/400.html');
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
  checkCreateJobMessage,
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
