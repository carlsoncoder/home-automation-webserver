var dateTimeServices = {};

dateTimeServices.getCurrentUtcDate = function() {
    return getUtcDateTime();
};

dateTimeServices.getCurrentUtcUnixTimestamp = function() {
    // returns the seconds from epoch until current UTC date/time
    var utcNow = getUtcDateTime();
    return Math.floor(utcNow.getTime() / 1000);
};

function getUtcDateTime() {
    var current = new Date();
    return new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), current.getUTCHours(), current.getUTCMinutes(), current.getUTCSeconds());
}

module.exports = dateTimeServices;