const path = require('path');
const slsw = require('serverless-webpack');
// const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: 'development',
  optimization: {
    minimize: false
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.built'),
    filename: 'handler.js'
  },
  // externals: [ nodeExternals() ]
};