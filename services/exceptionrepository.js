var mongoose = require('mongoose');
var Exception = mongoose.model('Exception');

var exceptionRepository = {};

exceptionRepository.loadAll = function(callback) {
    Exception.find(function(err, exceptions) {
        if (err) {
            return callback(err);
        }

        return callback(null, exceptions);
    });
};

exceptionRepository.saveException = function(error, callback) {
    var caughtError = new Exception();
    caughtError.message = error.message;
    caughtError.stack = error.stack;
    caughtError.name = error.name;
    caughtError.save(function(err, savedError) {
        if (err) {
            return callback(err);
        }

        return callback(null, savedError);
    });
};

module.exports = exceptionRepository;