var express = require('express');
var app = express();
var path = require('path');

require('dotenv').config();

app.use(express.static(__dirname + '/static'));

app.get('/',function(req,res){

  res.sendFile(path.resolve('index.html'));

});

app.listen(process.env.SERVER_PORT);

console.log(`listen ${process.env.SERVER_PORT}`);