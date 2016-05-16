var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var mosca = require('mosca');
var bodyParser = require('body-parser');

const CERT_KEY_PATH = 'certs/carlsonhomeautomation_com.key';
const CERT_PATH = 'certs/carlsonhomeautomation_com_fullchain.pem';

//initialize config options
var configOptions = require('./config/config.js');

var certificateConfiguration = {
    key: fs.readFileSync(CERT_KEY_PATH),
    cert: fs.readFileSync(CERT_PATH)
};

// MOSCA
var moscaSettings = {
    port: 8883,
    logger: {
        name: "home-automation-mqtt-broker",
        level: 40
    },
    secure: {
        keyPath: CERT_KEY_PATH,
        certPath: CERT_PATH
    }
};

var mqttServer = new mosca.Server(moscaSettings);
mqttServer.on('ready', setup);

function setup() {
    console.log('The Mosca server is running!');
}

// fired when a client is connected
mqttServer.on('clientConnected', function(client) {
    console.log('client connected', client.id);
});

// fired when a message is received
mqttServer.on('published', function(packet, client) {
    console.log('Published : ', packet);
    if (typeof(packet.payload) !== 'string') {
        var jsonPayload = JSON.parse(packet.payload.toString("utf8"));
        console.log(jsonPayload.Age + ';;' + jsonPayload.Name + ';;' + jsonPayload.IsTest);
    }
    else {
        console.log(packet.payload);
    }
});

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
if (configOptions.MY_NODE_ENV === 'development')
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

function logErrorToMongo(error) {
    console.log(error.message + '--' + error + '--' + error.stack);
    exceptionRepository.saveException(error, function(err, savedError) {
        if (err) {
            console.log('An error occurred while trying to save the error');
            console.log(err.message + '--' + err + '--' + err.stack);
        }
    });
}

// TODO: JUSTIN: REMOVE THIS TESTING FUNCTION!
app.post('/testing/sendMessage', function(req, res) {
    var message = {
        topic: 'pythonTest/garage1',
        payload: 'Test Message 1234 Carlson',
        qos: 0,
        retain: false
    };

    mqttServer.publish(message, function() {
        res.send('Message processed succesfully!');
    })
});

var secureServer = https.createServer(certificateConfiguration, app).listen(4443, function() {
    console.log('listening on port 4443 - HTTPS');
});
secureServer.on('error', onError);

// Final catch of any errors in the process - Catch any uncaught errors that weren't wrapped in a try/catch statement
process.on('uncaughtException', function(err) {
    logErrorToMongo(err);
});

module.exports = app;