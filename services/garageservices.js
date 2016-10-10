var exceptionRepository = require('./exceptionrepository.js');
var garageStatusRepository = require('./garagestatusrepository.js');
var dateTimeServices = require('./datetimeservices.js');

var garageServices = {};

garageServices.handleMessageReply = function(packet, client) {
    // two possible queues could (*should*) come into this function
        //      /garage/{clientId}/healthCheck/reply
        //      /garage/{clientId}/doorAction/reply  **Note, we don't actually care about this one, since we have to re-poll anyway for the status later (give it time to open/close)

    // parse the clientId first
    var startIndex = packet.topic.indexOf('/garage/') + 8;
    var endIndex = packet.topic.substring(startIndex).indexOf('/');
    var clientId = packet.topic.substring(startIndex, endIndex + startIndex);

    var shouldUpdate = true;
    var garageStatus = { clientId: clientId };
    var currentUtcDate = dateTimeServices.getCurrentUtcDate();
    var jsonPayload = JSON.parse(packet.payload.toString("utf8"));

    if (jsonPayload.error) {
        // Client reported an error during execution of message - log it and do nothing else
        shouldUpdate = false;

        exceptionRepository.saveException(clientId, 'garage', packet.topic, jsonPayload.error, function(err) {
            if (err) {
                console.log(err.message + '--' + err + '--' + err.stack); 
            }
        });
    }
    else if (packet.topic.indexOf('/healthCheck/reply') > -1) {
        garageStatus.lastHealthCheckDateTime = currentUtcDate;
        garageStatus.currentDoorStatus = jsonPayload.doorStatus;
    }
    else {
        shouldUpdate = false;
        console.log('GarageServices - Ignoring packet with topic: ' + packet.topic);
    }

    if (shouldUpdate === true) {
        garageStatusRepository.updateStatusRecord(garageStatus, function (err) {
            if (err) {
                var fullMessage = 'Unable to save updated garage status - assume values are stale: ' + err.message;
                exceptionRepository.saveException(clientId, 'garage', packet.topic, fullMessage, function(err) {
                    if (err) {
                        console.log(err.message + '--' + err + '--' + err.stack);
                    }
                });
            }
        });
    }
};

garageServices.initializeCheckInterval = function(mqttBroker, garageClientIds) {
    // check status every 30 seconds
    var garageCheckInterval = setInterval(function() {
        garageClientIds.forEach(function(clientId) {

            var healthCheckTopic = '/garage/' + clientId + '/healthCheck';

            var healthCheckPayload = {};
            healthCheckPayload.timestamp = dateTimeServices.getCurrentUtcUnixTimestamp();

            var healthCheckMessage = {
                topic: healthCheckTopic,
                payload: JSON.stringify(healthCheckPayload),
                qos: 0,
                retain: false
            };

            mqttBroker.publish(healthCheckMessage, function() { } );
        });
    }, 30000);

    return garageCheckInterval;
};

module.exports = garageServices;