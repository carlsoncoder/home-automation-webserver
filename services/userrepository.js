var mongoose = require('mongoose');
var User = mongoose.model('User');

var userRepository = {};

userRepository.findUser = function(username, callback) {
    var query = User.findOne({username: username});
    query.exec(function(err, user) {
       if (err) {
           return callback(err);
       }

       return callback(err, user);
    });
};

userRepository.attemptLogin = function(username, password, callback) {
    userRepository.findUser(username.toLowerCase(), function(err, user) {
        if (err) {
            return callback(err);
        }
        
        if (!user || !user.hasValidPassword(password)) {
            return callback(null, 'Invalid Login Details');
        }

        return callback(null, null, user);
    });
};

userRepository.changePassword = function(username, newPassword, callback) {
    var query = User.findOne({username: username});
    query.exec(function(err, user) {
        if (err) {
            return callback(err);
        }

        user.setPassword(newPassword);
        user.save(function(err) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, 'Password Changed Successfully');
            }
        });
    });
};

module.exports = userRepository;