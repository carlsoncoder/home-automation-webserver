var express = require('express');
var router = express.Router();
var exceptionRepository = require('../services/exceptionrepository');
var jwt = require('express-jwt');
var configOptions = require('../config/config.js');

var auth = jwt({secret: configOptions.JWT_SECRET_KEY, userProperty: 'payload'});

// GET '/admin/exceptions'
router.get('/exceptions', auth, function(req, res, next) {
    exceptionRepository.loadAll(function(err, exceptions) {
       if (err) {
           return next(err);
       }

       return res.json(exceptions);
    });
});

module.exports = router;