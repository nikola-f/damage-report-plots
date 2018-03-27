import express = require('express');
import awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
import api = require('./api');
const app = express();


app.use(awsServerlessExpressMiddleware.eventContext());
app.use('/api', api);



module.exports = app;
