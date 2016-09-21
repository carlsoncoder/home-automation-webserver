var express = require('express');
var passport = require('passport');
var jwt = require('express-jwt');
var configOptions = require('../config/config.js');
var garageStatusRepository = require('../services/garagestatusrepository.js');

var router = express.Router();
var mqttBroker = require('../services/mqtt-server.js').getInstance();
var auth = jwt({secret: configOptions.JWT_SECRET_KEY, userProperty: 'payload'});

// GET - '/garage/status'
router.get('/status', auth, function(req, res, next) {
    garageStatusRepository.loadAll(function(err, garageStatuses) {
        if (err) {
            return res.status(500).json(err);
        }

        return res.status(200).json(garageStatuses);
    });
});

// GET - '/garage/statusByClientId/rpi-garage-main'
router.get('/statusByClientId/:clientId', auth, function(req, res, next) {
    var clientId = req.params.clientId;
    garageStatusRepository.findStatusRecord(clientId, function(err, garageStatus) {
        if (err) {
            return res.status(500).json(err);
        }

        return res.status(200).json(garageStatus);
    });
});

// POST - '/garage/open'
router.post('/open', auth, function(req, res, next) {
    var message = buildDoorActionMessage(req.body.clientId, true);

    mqttBroker.publish(message, function() {
        res.status(200).json({message: 'Message Queued Successfully!'});
    });
});

// POST - '/garage/close'
router.post('/close', auth, function(req, res, next) {
    var message = buildDoorActionMessage(req.body.clientId, false);

    mqttBroker.publish(message, function() {
        res.status(200).json({message: 'Message Queued Successfully!'});
    });
});

// POST - '/garage/sendManualMessage'
router.post('/sendManualMessage', auth, function(req, res, next) {
    var requestedTopic = req.body.topic;
    var clientId = req.body.clientId;
    var payload = JSON.stringify(req.body.messagePayload);

    var topic = '/garage/' + clientId + '/' + requestedTopic;

    var message = {
        topic: topic,
        payload: payload,
        qos: 0,
        retain: false
    };

    mqttBroker.publish(message, function() {
        res.status(200).json({message: 'Message Queued Successfully!'});
    });
});

function buildDoorActionMessage(clientId, isOpen) {
    var topic = '/garage/' + clientId + '/doorAction';
    
    var payload = {};
    if (isOpen === true) {
        payload.action = 'open';
    }
    else {
        payload.action = 'close';
    }

    var message = {
        topic: topic,
        payload: JSON.stringify(payload),
        qos: 0,
        retain: false
    };

    console.log('Door Action Message: ' + JSON.stringify(message));
    
    return message;
}

module.exports = router;