var mosca = require('mosca');
var configOptions = require('../config/config.js');

/*
// TODO: JUSTIN: REMOVE DEBUG CODE!
app.post('/testingSendMessageRpiMainDoorAction', function(req, res) {
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

app.post('/testingSendMessageRpiMain', function(req, res) {
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

app.post('testingSendMessageRpiBarn', function(req, res) {
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
*/

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
            console.log('The Mosca server is running!');
            mqttServer.authenticate = mosca_authenticate;
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
    }
    
    return mqttServer;
};