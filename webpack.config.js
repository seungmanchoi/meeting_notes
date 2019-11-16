var webpack = require('webpack');
var path = require('path');

module.exports = {
  // entry: ['./static/web.js'],
  entry: ['./static/socket.test.js'],
  output: {
    path: path.join(__dirname, 'static'),
    filename: "build.js"
  }
}