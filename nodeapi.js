// express 등록
var express    = require('express');
var app        = express();
var path       = require('path');

// req.body 데이터를 받기위한 body-parser 모듈
var bodyParser = require('body-parser');

// aws-sdk 등록
var AWS	       = require('aws-sdk');

// 보안을 위해 helmet 모듈 (보안관련 헤더 9개의 설정을 바꿔줌)
var helmet     = require('helmet');
//var cors       = require('cors');
//var mysql      = require('mysql');

app.use(helmet());

// 통신 프로토콜 모듈
const http  = require('http');
//const https = require('https');

// 파일시스템 모듈
const fs    = require('fs');
// Database
/*var db = mysql.createConnection({
    host:'localhost',
    user:'unicorn',
    password:'unicorn2015!',
    database:'unicorn'
});*/

/** Middlewares */
// body-parser 미들웨어를 익스프레스 객체에 추가
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'content-type');
  next();
});

//app.use(cors());

// API
app.use('/api/sample', require('./api/sample'));

app.use('/uploads', express.static('uploads'));

app.all('/*', function ( req, res, next ) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// Server
/*
var port = 3000;
app.listen(port, function(){
  console.log('listening on port:' + port);
})
*/

const privateKey = fs.readFileSync('./ssl/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./ssl/cert.pem', 'utf8');
const ca = fs.readFileSync('./ssl/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

const httpServer = http.createServer(app);
//const httpsServer = https.createServer(credentials, app);

httpServer.listen(3100, () => {
	console.log('HTTP Server running on port 80');
});

/*
httpsServer.listen(3543, () => {
	console.log('HTTPS Server running on port 443');
});
*/

