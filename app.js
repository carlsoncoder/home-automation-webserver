var debug = require('debug')('home-automation-webserver:server');
var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

//initialize config options
var configOptions = require('./config/config.js');

var certificates = {
    key: fs.readFileSync('certs/carlsonhomeautomation_com.key'),
    cert: fs.readFileSync('certs/carlsonhomeautomation_com_fullchain.pem')
};

//mongoose
var mongoose = require('mongoose');
require('./models/Users');
require('./models/Exceptions');

// Exception repository
var exceptionRepository = require('./services/exceptionrepository');

//passport
var passport = require('passport');
require('./config/passport');

//connect to MongoDB
var mongoConnectionString = configOptions.MONGO_DB_CONNECTION_STRING;
mongoose.connect(mongoConnectionString);

// Express setup
var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

// define routing for Express
var home = require('./routes/home');
var admin = require('./routes/admin');

app.use('/', home);
app.use('/admin', admin);

// catch 404 errors and route to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler - will print stack traces
if (process.env.NODE_ENV === 'development')
{
    app.use(function(err, req, res, next) {
        logErrorToMongo(err);
        res.status(err.status || 500).json({errorMessage: err.message, error: err});
    });
}

// production error handler - no stack trace shown to user
app.use(function(err, req, res, next) {
    logErrorToMongo(err);
    res.status(err.status || 500).json({errorMessage: err.message});
});

function normalizePort(portValue) {
    var port = parseInt(portValue, 10);

    if (isNaN(port)) {
        // named pipe
        return portValue;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code)
    {
        case 'EACCES':
        {
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        }
        case 'EADDRINUSE':
        {
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        }
        default:
        {
            throw error;
        }
    }
}

function onListening() {
    var address = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + address : 'port ' + address.port;
    debug('Listening on ' + bind);
}

function logErrorToMongo(error) {
    console.log(error.message + '--' + error + '--' + error.stack);
    exceptionRepository.saveException(error, function(err, savedError) {
        if (err) {
            console.log('An error occurred while trying to save the error');
            console.log(err.message + '--' + err + '--' + err.stack);
        }
    });
}

// Get port from environment and store in Express */
var port = normalizePort(process.env.OPENSHIFT_NODEJS_PORT || '3000');
app.set('port', port);

var ipAddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
app.set('ipAddress', ipAddress);

//var server = http.createServer(app);
var server = https.createServer(certificates, app);
server.listen(port, ipAddress);
server.on('error', onError);
server.on('listening', onListening);

// Final catch of any errors in the process
// Catch any uncaught errors that weren't wrapped in a try/catch statement
process.on('uncaughtException', function(err) {
    logErrorToMongo(err);
});

module.exports = app;