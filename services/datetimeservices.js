var dateTimeServices = {};

dateTimeServices.getCurrentUtcDate = function() {
    var current = new Date();
    return new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), current.getUTCHours(), current.getUTCMinutes(), current.getUTCSeconds());
};

dateTimeServices.getCurrentUtcUnixTimestamp = function() {
    // returns the seconds from epoch until current UTC date/time
    var current = new Date();
    return Math.floor(current.getTime() / 1000);
};

module.exports = dateTimeServices;