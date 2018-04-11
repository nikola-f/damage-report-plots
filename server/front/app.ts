import express = require('express');
import session = require('express-session');
import passport = require('passport');
const DynamoStore = require('connect-dynamodb-session')(session);
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
import {Session, Tokens} from '../types';

import awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
import api = require('./api');
import util = require('../util');
import me = require('./me');
const app = express();


const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL_ME: string = process.env.GOOGLE_CALLBACK_URL_ME;
const GOOGLE_CALLBACK_URL_JOB: string = process.env.GOOGLE_CALLBACK_URL_JOB;
const SESSION_SECRET: string = process.env.SESSION_SECRET;
const SESSION_MAXAGE: number = 1000 * 60 * 60; //1時間


app.use(awsServerlessExpressMiddleware.eventContext());

// sessionとストレージ(dynamo)設定
app.use(session({
  store: new DynamoStore({
    region: process.env.AWS_REGION,
    tableName: 'session',
    cleanupInterval: SESSION_MAXAGE,
    touchAfter: 0
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // trueだとlambda proxy環境下で動作しない
    maxAge: SESSION_MAXAGE
  }
}));

// passport.js 初期化
app.use(passport.initialize());
app.use(passport.session());


// 認証時のGoogle OAuth2, openidとfusiontables照会
passport.use('google-me', new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CALLBACK_URL_ME
}, (accessToken, refreshToken, profile, done) => {
  console.log('profile:', profile);

  //iconのURL
  const photoUrl = util.isSet(() => profile.photos[0].value) ?
    profile.photos[0].value : undefined;
  const tokens: Tokens = {
    "meAccessToken": accessToken
  };
  const user: Session = {
    "openId": profile.id,
    "createTime": Date.now(),
    "lastAccessTime": Date.now(),
    "photoUrl": photoUrl,
    "tokens": tokens,
  }
  done(null, user);
}));

app.get('/auth/signin',
  (req, res, next) => {
    if(req.isAuthenticated()) {
      res.redirect('/me');
    }else{
      next();
    }
  },
  passport.authenticate('google-me', {
    scope: [
      'openid',
      'https://www.googleapis.com/auth/fusiontables.readonly'
    ],
    failureRedirect: '/401.html'
  })
);

app.get('/auth/callback/me',
  passport.authenticate('google-me', {
    failureRedirect: '/401.html'
  }),
  (req, res) => {
    console.log('session:', req.session);
    res.redirect('/me');
  }
);


// job作成時のGoogle OAuth2, gmail照会とfusiontables更新, offline
// passport.use('google-job', new GoogleStrategy({
//   clientID: GOOGLE_CLIENT_ID,
//   clientSecret: GOOGLE_CLIENT_SECRET,
//   callbackURL: GOOGLE_CALLBACK_URL_JOB,
//   accessType: 'offline'
// }, (accessToken, refreshToken, profile, done) => {
//   console.log('profile:', profile);
// }));

// app.get('/auth/job', 
//   passport.authenticate('google-job', {
//     scope: [
//       'https://www.googleapis.com/auth/fusiontables',
//       'https://www.googleapis.com/auth/gmail.readonly'
//     ],
//     failureRedirect: '/401.html'
//   })
// );

// router.get('/auth/callback/job', (req, res) => {
//   res.json({ message: 'callback' });
// });


passport.serializeUser((user, done) => {
  user.lastAccessTime = Date.now();
  console.log('serializeUser:', user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  user.lastAccessTime = Date.now();
  console.log('deserializeUser:', user);
  done(null, user);
});

app.use('/api', api);
app.use('/me', me);


app.use((err, req, res, next) => {
  console.error(err.stack);
  next(err);
});



module.exports = app;
