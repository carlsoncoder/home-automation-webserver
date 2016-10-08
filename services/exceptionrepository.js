var mongoose = require('mongoose');
var Exception = mongoose.model('Exception');
var dateTimeServices = require('../services/datetimeservices.js');

var exceptionRepository = {};

exceptionRepository.loadAll = function(callback) {
    Exception.find(function(err, exceptions) {
        if (err) {
            return callback(err);
        }

        return callback(null, exceptions);
    });
};

exceptionRepository.saveException = function(clientId, category, topic, message, callback) {
    var exception = new Exception();
    exception.clientId = clientId;
    exception.whenOccurred = dateTimeServices.getCurrentUtcDate();
    exception.category = category;
    exception.topic = topic;
    exception.message = message;

    exception.save(function(err, savedException) {
        if (err) {
            callback(err);
        }

        callback(null);
    });
};

exceptionRepository.initializeOnStartup = function(callback) {
    Exception.remove({}, function(err) {
        if (err) {
            callback(err)
        }

        callback(null)
    });
};

module.exports = exceptionRepository;