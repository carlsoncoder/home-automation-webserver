var dateTimeServices = {};

dateTimeServices.getCurrentUtcDate = function() {
    var current = new Date();
    var utcDate = new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), current.getUTCHours(), current.getUTCMinutes(), current.getUTCSeconds());
    
    return utcDate;
};

module.exports = dateTimeServices;