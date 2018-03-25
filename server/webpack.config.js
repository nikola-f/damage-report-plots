const path = require('path');
const slsw = require('serverless-webpack');

module.exports = {
  // entry: './handler.ts',
  entry: slsw.lib.entries,
  target: 'node',
  module: {
    loaders: [
      {test: /\.ts(x?)$/, loader: 'ts-loader' },
      {test: /\.json$/, loader: 'json-loader' }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.jsx']
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.built'),
    filename: 'handler.js'
  },
  externals: {
    "aws-sdk": 'commonjs aws-sdk',
  }
};
