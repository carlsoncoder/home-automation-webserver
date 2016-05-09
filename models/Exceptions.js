var os = require('os');
var mongoose = require('mongoose');

var ExceptionSchema = new mongoose.Schema({
    machineName: String,
    whenOccurred: Date,
    message: String,
    stack: String,
    name: String
});

ExceptionSchema.pre('validate', function(next) {
    if (typeof (this.machineName) === 'undefined' || this.machineName === null) {
        this.machineName = os.hostname();
        this.whenOccurred = new Date();
    }

    next();
});

mongoose.model('Exception', ExceptionSchema);