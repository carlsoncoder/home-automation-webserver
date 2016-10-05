var mongoose = require('mongoose');

var GarageStatusSchema = new mongoose.Schema({
    clientId: String,
    description: String,
    sortOrder: Number,
    lastHealthCheckDateTime: Date,
    lastDoorStatusDateTime: Date,
    currentDoorStatus: String // 'open' or 'closed'
});

mongoose.model('GarageStatus', GarageStatusSchema);