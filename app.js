var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var mosca = require('mosca');
var bodyParser = require('body-parser');

//initialize config options
var configOptions = require('./config/config.js');

var certificateConfiguration = {
    key: fs.readFileSync(configOptions.CERT_KEY_PATH),
    cert: fs.readFileSync(configOptions.CERT_PATH)
};

// MOSCA
var moscaSettings = {
    port: 8883,
    logger: {
        name: "home-automation-mqtt-broker",
        level: 40
    },
    secure: {
        keyPath: configOptions.CERT_KEY_PATH,
        certPath: configOptions.CERT_PATH
    }
};

var mqttServer = new mosca.Server(moscaSettings);
mqttServer.on('ready', setup);

function setup() {
    console.log('The Mosca server is running!');
    mqttServer.authenticate = mosca_authenticate;
}

function mosca_authenticate(client, username, password, callback) {
    var authenticated = false;
    
    // TODO: JUSTIN: REMOVE DEBUG CODE!
    console.log('IN MOSCA AUTHENTICATE METHOD');
    console.log(client);
    console.log(username);
    console.log(password);
    // TODO: JUSTIN: END REMOVE DEBUG CODE!
    
    if (configOptions.isClientIdValid(client.id)) {
        if (username === configOptions.MOSCA_USERNAME && password === configOptions.MOSCA_PASSWORD) {
            authenticated = true;
        }
    }
    
    callback(null, authenticated)
}

// fired when a client is connected
mqttServer.on('clientConnected', function(client) {
    console.log('client connected', client.id);
});

// fired when a message is received
mqttServer.on('published', function(packet, client) {
    console.log('RECEIVED MESSAGE FROM: ', packet.topic);
    if (typeof(packet.payload) !== 'string') {
        var jsonPayload = JSON.parse(packet.payload.toString("utf8"));
        console.log(jsonPayload);
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

// TODO: JUSTIN: REMOVE DEBUG CODE!
app.post('/testing/sendMessage/rpi/maindooraction', function(req, res) {
    var payload = { action: 'open' };
    var message = {
        topic: '/rpi-garage-main/doorAction',
        payload: JSON.stringify(payload),
        qos: 0,
        retain: false
    };

    mqttServer.publish(message, function() {
        res.send('Message processed succesfully!');
    });
});

app.post('/testing/sendMessage/rpi/main', function(req, res) {
    var payload = { firstValue: '123', secondValue: '456', shouldOpen: 1 };
    var message = {
        topic: '/rpi-garage-main/healthCheck',
        payload: JSON.stringify(payload),
        qos: 0,
        retain: false
    };

    mqttServer.publish(message, function() {
        res.send('Message processed succesfully!');
    });
});

app.post('/testing/sendMessage/rpi/barn', function(req, res) {
    var payload = { firstValue: '123', secondValue: '456', shouldOpen: 1 };
    var message = {
        topic: '/rpi-garage-barn/healthCheck',
        payload: JSON.stringify(payload),
        qos: 0,
        retain: false
    };

    mqttServer.publish(message, function() {
        res.send('Message processed succesfully!');
    });
});
// TODO: JUSTIN: END REMOVE DEBUG CODE!

var secureServer = https.createServer(certificateConfiguration, app).listen(4443, function() {
    console.log('listening on port 4443 - HTTPS');
});
secureServer.on('error', onError);

// Final catch of any errors in the process - Catch any uncaught errors that weren't wrapped in a try/catch statement
process.on('uncaughtException', function(err) {
    logErrorToMongo(err);
});

module.exports = app;