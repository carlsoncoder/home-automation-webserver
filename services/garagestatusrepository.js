var mongoose = require('mongoose');
var GarageStatus = mongoose.model('GarageStatus');

var garageStatusRepository = {};

garageStatusRepository.findStatusRecord = function(clientId, callback) {
    var query = GarageStatus.findOne({clientId: clientId});
    query.exec(function(err, garageStatus) {
        if (err) {
            return callback(err);
        }

        var modifiedStatus = ensureAllFields(garageStatus);

        return callback(err, modifiedStatus);
    });
};

garageStatusRepository.loadAll = function(callback) {
    var query = GarageStatus.find({});
    query.exec(function(err, statuses) {
        if (err) {
            return callback(err);
        }

        var returnStatuses = [];
        statuses.forEach(function(status) {
            returnStatuses.push(ensureAllFields(status));
        });

        return callback(null, returnStatuses);
    });
};

garageStatusRepository.updateStatusRecord = function(garageStatus, callback) {
    var query = GarageStatus.findOne({clientId: garageStatus.clientId});
    query.exec(function(err, existingGarageStatus) {
        if (err) {
            return callback(err);
        }
        
        if (garageStatus.lastHealthCheckDateTime) {
            existingGarageStatus.lastHealthCheckDateTime = garageStatus.lastHealthCheckDateTime;
        }
        
        if (garageStatus.lastDoorStatusDateTime) {
            existingGarageStatus.lastDoorStatusDateTime = garageStatus.lastDoorStatusDateTime;
        }
        
        if (garageStatus.currentDoorStatus) {
            existingGarageStatus.currentDoorStatus = garageStatus.currentDoorStatus;
        }
        
        existingGarageStatus.save(function(err) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null);
            }
        });
    });
};

garageStatusRepository.initializeOnStartup = function(garageClientIds, callback) {
    GarageStatus.remove({}, function(err) {
        if (err) {
            callback(err)
        }
        else {
            // insert them back in with the default values
            garageClientIds.forEach(function(clientId) {
                var garageStatus = new GarageStatus();
                garageStatus.clientId = clientId;
                garageStatus.save(function(err, newStatus) {
                   if (err) {
                       callback(err);
                   } 
                });
                
            });
        }
    })
};

function ensureAllFields(status) {
    var updatedStatus = {clientId: '', lastHealthCheckDateTime: '', lastDoorStatusDateTime: '', currentDoorStatus: ''};

    if (status.clientId) {
        updatedStatus.clientId = status.clientId;
    }

    if (status.lastHealthCheckDateTime) {
        updatedStatus.lastHealthCheckDateTime = status.lastHealthCheckDateTime;
    }

    if (status.lastDoorStatusDateTime) {
        updatedStatus.lastDoorStatusDateTime = status.lastDoorStatusDateTime;
    }

    if (status.currentDoorStatus) {
        updatedStatus.currentDoorStatus = status.currentDoorStatus;
    }

    return updatedStatus;
}

module.exports = garageStatusRepository;