var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var userRepository = require('../services/userrepository');

passport.use(new LocalStrategy(
    function(username, password, done) {
        userRepository.attemptLogin(username, password, function(err, message, user) {
            if (err) {
                return done(err);
            }

            if (message) {
                return done(null, false, { message: message });
            }

            return done(null, user);
        });
    }
));