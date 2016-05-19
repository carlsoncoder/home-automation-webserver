var express = require('express');
var passport = require('passport');
var jwt = require('express-jwt');
var configOptions = require('../config/config.js');
var userRepository = require('../services/userrepository.js');

var router = express.Router();
var auth = jwt({secret: configOptions.JWT_SECRET_KEY, userProperty: 'payload'});

// GET '/'
router.get('/', function(req, res, next) {
    res.status(200).json({message: 'Hello from Carlson Home Automation Web Server - Powered by AWS EC2!'});
});

// POST '/login'
router.post('/login', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({message: 'Please fill out all required fields'});
    }

    passport.authenticate('local', function(err, user, info) {
       if (err) {
           return next(err);
       }

       if (user) {
           return res.json({token: user.generateJWT()});
       }
       else {
           return res.status(401).json(info);
       }
    })(req, res, next);
});

// POST '/changepassword'
router.post('/changepassword', auth, function(req, res, next) {
    // Passport expects these to be on the body of the POST request, so we manually put them there
    req.body.username = req.payload.username;
    req.body.password = req.body.oldPassword;

    passport.authenticate('local', function(err, user, info) {
        if (err) {

            return res.status(401).json(err);
        }

        if (user) {
            userRepository.changePassword(user.username, req.body.newPassword, function(err, message) {
                if (err) {
                    return res.status(401).json(err);
                }

                return res.status(200).json(message);
            });
        }
        else {
            return res.status(401).json(info.message);
        }
    })(req, res, next);

});

module.exports = router;