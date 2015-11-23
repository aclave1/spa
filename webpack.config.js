var webpack = require('webpack');
var path = require('path');
var jsPath = __dirname;
module.exports = {
  context: jsPath,
  entry: {
    'spa':'./index.js',
  },
  output: {
    path: jsPath+'/dist',
    filename: '[name].js',
    library:'Spa'
  },
  module: {
  },
};