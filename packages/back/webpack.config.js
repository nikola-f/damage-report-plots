const path = require('path');
const slsw = require('serverless-webpack');
const hswp = require('hard-source-webpack-plugin');
// const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: 'development',
  optimization: {
    minimize: false
  },
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'ts-loader',
    }]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      "@common": "@damage-report-plots/common/src",
    }
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.built'),
    filename: 'handler.js'
  },
  plugins: [
    new hswp()
  ]
  // externals: [ nodeExternals() ]
};
