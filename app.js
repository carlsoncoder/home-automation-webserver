var https = require('https');
var fs = require('fs');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

//initialize config options
var configOptions = require('./config/config.js');

var certificateConfiguration = {
    key: fs.readFileSync(configOptions.CERT_KEY_PATH),
    cert: fs.readFileSync(configOptions.CERT_PATH)
};

// Mongoose
var mongoose = require('mongoose');
require('./models/Users.js');
require('./models/Exceptions.js');
require('./models/GarageStatuses.js');

// Exception repository
var exceptionRepository = require('./services/exceptionrepository.js');

// Garage Status repository
var garageStatusRepository = require('./services/garagestatusrepository.js');

// Passport
var passport = require('passport');
require('./config/passport.js');

// Connect to MongoDB
var mongoConnectionString = configOptions.MONGO_DB_CONNECTION_STRING;
mongoose.connect(mongoConnectionString);

// Express setup
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

// Enable CORS in the response headers
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

// define routing for Express
var home = require('./routes/home');
var admin = require('./routes/admin');
var garage = require('./routes/garage');

app.use('/', home);
app.use('/admin', admin);
app.use('/garage', garage);

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

var secureServer = https.createServer(certificateConfiguration, app).listen(4443, function() {
    console.log('HTTPS listening on port 4443');
    
    // initialize MOSCA MQTT broker - the 'getInstance()' call forces it to load and init, even though we aren't doing anything with it here
    var mqttBroker = require('./services/mqtt-server.js').getInstance();

    // reset the garage status records
    garageStatusRepository.initializeOnStartup(configOptions.getGarageClientDetails(), function(err) {
        if (err) {
            // INTENTIONALLY CRASH THE APP IF THIS FAILS!
            process.exit(1);
        }
    });
});

secureServer.on('error', onError);

// Final catch of any errors in the process - Catch any uncaught errors that weren't wrapped in a try/catch statement
process.on('uncaughtException', function(err) {
    logErrorToMongo(err);
});

module.exports = app;