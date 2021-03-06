var path = require('path');
var express = require('express');
var pkg = require(path.join(__dirname, 'package.json'));
var twitter = require('twitter-text');
var program = require('commander');
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({'timestamp': true})
    ]
});

var DEFAULT_PORT = 8000;
var DEFAULT_HOST = '127.0.0.1';
var MAX_BODY_LENGTH = 64 * 1024;
var MAX_MESSAGE_LENGTH = 280;


program
    .version(pkg.version)
    .option('-p, --port [port]', 'Port on which to listen to (defaults to ' + DEFAULT_PORT + ')', parseInt)
    .option('-h, --host [host]', 'Host on which to listen to (defaults to ' + DEFAULT_HOST + ')')
    .parse(process.argv)
;

var error = function (status, message) {
    var e = new Error();
    e.status = status;

    if (typeof message !== 'undefined') {
        e.message = message;
    }

    return e;
};
var left = function (message) {
    return MAX_MESSAGE_LENGTH - twitter.getTweetLength(message);
};
var port = program.port || DEFAULT_PORT;
var host = program.host || DEFAULT_HOST;
var app = express();

app.use(function(req, res, next) {
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
        if ((data.length + chunk.length) > MAX_BODY_LENGTH) {
            next(error(400, 'Request body too large'));
        }

        data += chunk;
    });
    req.on('end', function() {
        req.body = data;
        next();
    });
});
app.post('/symbols-left', function(req, res) {
    res.send('' + left(req.body));
});
app.get('/symbols-left', function(req, res) {
    if (!req.query.message) {
        throw error(400, 'Missing "message" query parameter');
    }

    res.send('' + left(req.query.message));
});
app.post('/message-length', function(req, res) {
    res.send('' + twitter.getTweetLength(req.body));
});
app.get('/message-length', function(req, res) {
    if (!req.query.message) {
        throw error(400, 'Missing "message" query parameter');
    }

    res.send('' + twitter.getTweetLength(req.query.message));
});
app.use(function(req, res, next) {
    throw error(404);
});
app.use(function(err, req, res, next) {
    var status = err.status || 500;

    if (status < 400 || status > 599) {
        status = 500;
    }

    res.status(status);

    switch (status) {
        case 404:
            res.send('Not found');
            logger.log('error', 'HTTP Not found (' + req.method + ' ' + req.path + ')');
            break;
        case 400:
            if (err.message) {
                res.send('Bad request (' + err.message + ')');
                logger.log('error', 'HTTP Bad request (' + err.message + ')');
            } else {
                res.send('Bad request');
                logger.log('error', 'HTTP Bad request');
            }

            break;
        case 500:
            res.send('Internal server error');
            logger.log('error', err.stack);
            break;
        default:
            res.send('Unknown error');
            logger.log('error', err.stack);
            break;
    }
});
app.listen(port, host, function () {
    logger.log('info', 'Twitter Message Length v' + pkg.version);
    logger.log('info', 'Listening on ' + host + ':' + port);
});
