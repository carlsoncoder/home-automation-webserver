var exceptionRepository = require('./exceptionrepository.js');
var garageStatusRepository = require('./garagestatusrepository.js');
var dateTimeServices = require('./datetimeservices.js');

var garageServices = {};

garageServices.handleMessageReply = function(packet, client) {
    // three possible queues could (*should*) come into this function
        //      /garage/{clientId}/healthCheck/reply
        //      /garage/{clientId}/doorStatus/reply
        //      /garage/{clientId}/doorAction/reply  **Note, we don't actually care about this one, since we have to re-poll anyway for the status later (give it time to open/close)

    // parse the clientId first
    var startIndex = packet.topic.indexOf('/garage/') + 8;
    var endIndex = packet.topic.substring(startIndex).indexOf('/');
    var clientId = packet.topic.substring(startIndex, endIndex + startIndex);

    var shouldUpdate = true;
    var garageStatus = { clientId: clientId };
    var currentUtcDate = dateTimeServices.getCurrentUtcDate();

    if (packet.topic.indexOf('/healthCheck/reply') > -1) {
        garageStatus.lastHealthCheckDateTime = currentUtcDate;
    }
    else if (packet.topic.indexOf('/doorStatus/reply') > -1) {
        garageStatus.lastDoorStatusDateTime = currentUtcDate;

        var jsonPayload = JSON.parse(packet.payload.toString("utf8"));
        garageStatus.currentDoorStatus = jsonPayload.doorStatus;
    }
    else {
        shouldUpdate = false;
        console.log('GarageServices - Ignoring packet with topic: ' + packet.topic);
    }

    if (shouldUpdate === true) {
        garageStatusRepository.updateStatusRecord(garageStatus, function (err) {
            if (err) {
                exceptionRepository.saveException(err, function (exceptionError, savedError) {
                    if (err) {
                        console.log('An error occurred while trying to save the error');
                        console.log(exceptionError)
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
            var healthCheckMessage = {
                topic: healthCheckTopic,
                payload: '',
                qos: 0,
                retain: false
            };

            var doorStatusTopic = '/garage/' + clientId + '/doorStatus';
            var doorStatusMessage = {
                topic: doorStatusTopic,
                payload: '',
                qos: 0,
                retain: false
            };

            mqttBroker.publish(healthCheckMessage, function() {
                mqttBroker.publish(doorStatusMessage, function() {
                })
            });
        });
    }, 30000);

    return garageCheckInterval;
};

module.exports = garageServices;