var mosca = require('mosca');
var configOptions = require('../config/config.js');
var garageServices = require('./garageservices.js');

var mqttServer = null;
var mqttServerGarageCheckInterval = null;

function mosca_authenticate(client, username, password, callback) {
    var authenticated = false;
    if (configOptions.isClientIdValid(client.id)) {
        if (username.toString() === configOptions.MOSCA_USERNAME && password.toString() === configOptions.MOSCA_PASSWORD) {
            authenticated = true;
        }
    }

    callback(null, authenticated)
}

function clientConnected(client) {
    console.log('MQTT Client Connected: ', client.id);
}

function handlePublishedMessage(packet, client) {
    if (!packet || !client) {
        return;
    }
    
    console.log('Received message with topic [' + packet.topic + '] from clientId: ' + client.id);
    
    // if the topic StartsWith "/garage/", and contains "/reply"
    if (packet.topic.lastIndexOf("/garage/", 0) === 0 && packet.topic.indexOf('/reply') > -1) {
        garageServices.handleMessageReply(packet, client);
    }
    else {
        console.log('Ignoring packet...')
    }
}

module.exports.getInstance = function() {
    if (!mqttServer) {
        
        // lazy-load and initialize the MQTT server
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

        mqttServer = new mosca.Server(moscaSettings);
        mqttServer.on('ready', setup);

        function setup() {
            mqttServer.authenticate = mosca_authenticate;
            console.log('The MQTT broker is now running on port: ' + moscaSettings.port);
        }
        
        // fired when a client is connected
        mqttServer.on('clientConnected', function(client) {
            clientConnected(client);
        });
        
        // fired when a message is received
        mqttServer.on('published', function(packet, client) {
            handlePublishedMessage(packet, client);
        });

        // check status every 30 seconds
        mqttServerGarageCheckInterval = garageServices.initializeCheckInterval(mqttServer, configOptions.getValidGarageClientIds());
    }
    
    return mqttServer;
};