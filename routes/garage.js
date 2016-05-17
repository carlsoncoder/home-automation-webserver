var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var configOptions = require('../config/config.js');
var mqttBroker = require('../services/mqtt-server.js').getInstance();
var auth = jwt({secret: configOptions.JWT_SECRET_KEY, userProperty: 'payload'});

// POST - /garage
router.post('/', auth, function(req, res, next) {
    console.log(req.body);
    var requestedTopic = req.body.topic;
    var clientId = req.body.clientId;
    var payload = JSON.stringify(req.body.messagePayload);

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