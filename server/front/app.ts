import express = require('express');
import awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const app = express();


app.use(awsServerlessExpressMiddleware.eventContext());


app.get('/', function (req, res) {
  res.json({ message: 'Hello World!' });
});


module.exports = app;
