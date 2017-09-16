var path = require('path');

module.exports = {
  entry: './handler.ts',
  target: 'node',
  module: {
    loaders: [
      {test: /\.ts(x?)$/, loader: 'ts-loader' },
      { test: /\.json$/, loader: 'json-loader' }
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
    "googleapis": 'googleapis'
  }
};
