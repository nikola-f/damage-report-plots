import {Session, Tokens} from '@damage-report-plots/common/types';

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const connectDynamodbSession = require('connect-dynamodb-session');
const DynamoStore = connectDynamodbSession(session);
const OAuth2Strategy = require('passport-google-oauth').OAuth2Strategy;

const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const util = require('@damage-report-plots/common/util');
const env = require('@damage-report-plots/common/env');
const api = require('./api');
// import {me} from './me';

const app = express();


const SESSION_MAXAGE: number = 1000 * 60 * 60; //1時間


app.use(awsServerlessExpressMiddleware.eventContext());

// sessionとストレージ(dynamo)設定
app.use(session({
  store: new DynamoStore({
    region: env.AWS_REGION,
    tableName: 'session',
    cleanupInterval: SESSION_MAXAGE,
    touchAfter: 0
  }),
  secret: env.SESSION_SECRET,
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
passport.use('google-me', new OAuth2Strategy({
  clientID: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  callbackURL: env.GOOGLE_CALLBACK_URL_ME
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
// app.use('/me', me);


app.use((err, req, res, next) => {
  console.error(err.stack);
  next(err);
});



module.exports = app;
