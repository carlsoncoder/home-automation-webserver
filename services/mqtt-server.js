var mosca = require('mosca');
var configOptions = require('../config/config.js');

var mqttServer = null;
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

        function mosca_authenticate(client, username, password, callback) {
            var authenticated = false;
            if (configOptions.isClientIdValid(client.id)) {
                if (username.toString() === configOptions.MOSCA_USERNAME && password.toString() === configOptions.MOSCA_PASSWORD) {
                    authenticated = true;
                }
            }

            callback(null, authenticated)
        }
        
        // fired when a client is connected
        mqttServer.on('clientConnected', function(client) {
            console.log('MQTT Client Connected: ', client.id);
        });
        
        // fired when a message is received
        mqttServer.on('published', function(packet, client) {
            console.log('RECEIVED MESSAGE FROM: ', packet.topic);

            if (packet.payload) {
                if (typeof(packet.payload) !== 'string') {
                    var jsonPayload = JSON.parse(packet.payload.toString("utf8"));
                    console.log(jsonPayload);
                }
                else {
                    console.log(packet.payload);
                }
            }
        });
    }
    
    return mqttServer;
};