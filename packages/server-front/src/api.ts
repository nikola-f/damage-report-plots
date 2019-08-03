import {Job, JobStatus} from ':common/types';

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

const libJob = require(':common/job');
const libAgent = require(':common/agent');
const libAuth = require(':common/auth');
const libFt = require(':common/fusiontables');
const launcher = require(':common/launcher');
const env = require(':common/env');


const api = express.Router();

const csrfProtection = csrf({"cookie": true});
api.use(cookieParser());

api.use(bodyParser.urlencoded({"extended": true}));
api.use(bodyParser.json());


const isAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()) {
    next();
  }else{
    res.status(401).json({
      "message": 'Unauthorized'
    });
  }
};


// job一覧
api.get('/jobs',
  isAuthenticated,
  async (req, res) => {
    const jobs: Job[] = await libJob.getJobList(req.user.openId);
    if(jobs) {
      res.json(jobs);
    }else{
      res.json([]);
    }
  }
);


// job登録
api.post('/job',
  // csrfProtection,
  isAuthenticated,
  async (req, res) => {
    let isValid: boolean = false;
    if(req.body && req.user) {
      // isValid = await libJob.validateCreateMessage(req.body, req.user);
      isValid = true;
    }
    if(isValid) {
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
        // TODO agent情報の追加
      };
      launcher.queueJobAsync(job);
      console.log('job queued:', job);
      res.json({
        "message": 'job queued.',
        "openId": job.openId,
        "createTime": job.createTime
      });
    }else{
      res.status(400).json({
        "message": 'Bad Request'
      });
    }
  }
);


// mUPV, mUPC : //TODO clientから直接照会する
// api.get('/mupx', isAuthenticated,
//   async (req, res) => {

//     const agent = await libAgent.getAgent(req.user.openId);
//     if(agent) {
//       res.json({
//         "mUpv": agent.mUpv,
//         "mUpc": agent.mUpc
//       });

//     }else{
//       res.status(404).json({
//         "message": 'Stats Not Found'
//       });
//     }

//   }
// );


// 通常Map, heatMap等 URL一覧
api.get('/maps', isAuthenticated,
  (req, res) => {

    res.json(req.user);
  }
);


// 統計値
// api.get('/stats', isAuthenticated,
//   (req, res) => {
//   //pUPV, pUPC
//   //週ごとのレポート数サマリ

//     res.json(req.user);
//   }
// );


export = api;
