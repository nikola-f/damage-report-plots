import {Job, JobStatus} from '@damage-report-plots/common/types';

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

const libJob = require('@damage-report-plots/common/job');
const launcher = require('@damage-report-plots/common/launcher');
const env = require('@damage-report-plots/common/env');


const api = express.Router();

const csrfProtection = csrf({"cookie": true});
api.use(cookieParser());

api.use(bodyParser.urlencoded({"extended": true}));
api.use(bodyParser.json());


const isAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()) {
    next();
  }else{
    res.redirect('/401.html');
  }
};


// job一覧
api.get('/jobs',
  isAuthenticated,
  async (req, res, next) => {
    const jobs: Job[] = await libJob.getJobList(req.user.openId);
    req.jobs = jobs;
    next();
  },
  (req, res) => {
    req.jobs ? res.json(req.jobs) : res.json([]);
  }
);


// job登録
api.post('/job',
  // csrfProtection,
  isAuthenticated,
  async (req, res, next) => {
    let isValid: boolean = false;
    if(req.body && req.user) {
      isValid = await libJob.validateCreateMessage(req.body, req.user);
    }
    isValid ? next(): res.redirect('/400.html');
  },
  (req, res) => {
    const job: Job = {
      "openId": req.user.openId,
      "createTime": Date.now(),
      "status": JobStatus.Created,
      "lastAccessTime": Date.now(),
      "rangeFromTime": Number(req.body.rangeFromTime),
      "rangeToTime": Number(req.body.rangeToTime),
      "tokens": {
        "jobAccessToken": req.user.tokens.jobAccessToken,
        "jobRefreshToken": req.user.tokens.jobRefreshToken
      }
    };
    launcher.queueJobAsync(job);
    res.json({ message: 'job queued.' });
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
