var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var configOptions = require('../config/config.js');
var mqttBroker = require('../services/mqtt-server.js').getInstance();
var auth = jwt({secret: configOptions.JWT_SECRET_KEY, userProperty: 'payload'});

// TODO: JUSTIN:  Add in the "auth" middleware
    // Instead of "router.post('/', function(req, res, next)", we should have "router.post('/', auth, function(req, res, next)"

// TODO: JUSTIN:  Add in some "GET's" here so we can get the current status and/or the current health check
// POST - /garage
router.post('/', function(req, res, next) {
    var requestedTopic = req.body.topic;
    var clientId = req.body.clientId;
    var payload = JSON.stringify(req.body.payload);

    var topic = '/' + clientId + '/' + requestedTopic;

    var message = {
        topic: topic,
        payload: payload,
        qos: 0,
        retain: false
    };

    mqttBroker.publish(message, function() {
        res.status(200).json({message: 'Message Processed Successfully!'});
    });
});

module.exports = router;