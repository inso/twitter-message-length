var path = require('path');
var express = require('express');
var pkg = require(path.join(__dirname, 'package.json'));
var twitter = require('twitter-text');
var program = require('commander');
var bodyParser = require('body-parser');

var DEFAULT_PORT = 8000;
var DEFAULT_HOST = '127.0.0.1';


program
    .version(pkg.version)
    .option('-p, --port [port]', 'Port on which to listen to (defaults to ' + DEFAULT_PORT + ')', parseInt)
    .option('-h, --host [host]', 'Host on which to listen to (defaults to ' + DEFAULT_HOST + ')')
    .parse(process.argv)
;

var error = function (status) {
    var e = new Error();
    e.status = status;

    return e;
};
var left = function (message) {
    return 140 - twitter.getTweetLength(message);
};
var port = program.port || DEFAULT_PORT;
var host = program.host || DEFAULT_HOST;
var app = express();

app.use(bodyParser.text({ type: '*/*' }));
app.post('/symbols-left', function(req, res) {
    res.send("" + left(req.body));
});
app.get('/symbols-left', function(req, res) {
    if (!req.query.message) {
        throw error(400);
    }

    res.send("" + left(req.query.message));
});
app.use(function(req, res, next) {
    throw error(404);
});
app.use(function(err, req, res, next) {
    var status = err.status || 500;
    res.status(status);
    var body = "";

    switch (status) {
        case 500:
            body = "Server error";
            break;
        case 404:
            body = "Not found";
            break;
        case 400:
            body = "Bad request";
            break;
    }

    res.send(body);
});
app.listen(port, host, function () {
    console.log('Running on ' + host + ':' + port);
});
