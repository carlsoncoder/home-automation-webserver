var mongoose = require('mongoose');

var ExceptionSchema = new mongoose.Schema({
    clientId: String,
    whenOccurred: Date,
    category: String,
    topic: String,
    message: String
});

mongoose.model('Exception', ExceptionSchema);