const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './handler.ts',
  target: 'node',
  mode: 'development',
  optimization: {
    minimize: false
  },
  context: path.resolve(__dirname, 'src'),
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
    filename: 'index.js'
  },
  externals: [ nodeExternals() ]
};
