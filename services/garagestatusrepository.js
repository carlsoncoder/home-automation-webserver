var mongoose = require('mongoose');
var GarageStatus = mongoose.model('GarageStatus');

var garageStatusRepository = {};

garageStatusRepository.findStatusRecord = function(clientId, callback) {
    var query = GarageStatus.findOne({clientId: clientId});
    query.exec(function(err, garageStatus) {
        if (err) {
            return callback(err);
        }

        cleanUpStatusObject(garageStatus);

        return callback(null, garageStatus);
    });
};

garageStatusRepository.loadAll = function(callback) {
    var query = GarageStatus.find({});
    query.exec(function(err, statuses) {
        if (err) {
            return callback(err);
        }

        statuses.forEach(function(status) {
           cleanUpStatusObject(status);
        });

        return callback(null, statuses);
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

garageStatusRepository.initializeOnStartup = function(garageClientDetails, callback) {
    GarageStatus.remove({}, function(err) {
        if (err) {
            callback(err)
        }
        else {
            // insert them back in with the default values
            garageClientDetails.forEach(function(garageDetail) {
                var garageStatus = new GarageStatus();
                garageStatus.clientId = garageDetail.clientId;
                garageStatus.description = garageDetail.description;
                garageStatus.sortOrder = garageDetail.sortOrder;
                garageStatus.lastHealthCheckDateTime = null;
                garageStatus.currentDoorStatus = null;
                garageStatus.save(function(err, newStatus) {
                   if (err) {
                       callback(err);
                   } 
                });
                
            });
        }
    });
};

function cleanUpStatusObject(garageStatus) {
    delete garageStatus.__v;
    delete garageStatus._id;
}

module.exports = garageStatusRepository;