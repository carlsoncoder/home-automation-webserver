// how to call this script:
// node createuser.js username password, such as "node createuser.js admin p@ssword1"

//initialize config options
var configOptions = require('./config/config.js');

// Mongoose
var mongoose = require('mongoose');
require('./models/Users.js');
var User = mongoose.model('User');

// Connect to MongoDB
var mongoConnectionString = configOptions.MONGO_DB_CONNECTION_STRING;
mongoose.connect(mongoConnectionString);

// get the arguments
var userName = process.argv[2];
var password = process.argv[3];

var newUser = new User();
newUser.username = userName.toLowerCase();
newUser.setPassword(password);

newUser.save(function(err, insertedUser) {
    if (err) {
        console.log('Unable to insert user: ' + err);
        process.exit();
    }
    else {
        console.log('Successfully inserted user: ' + userName.toLowerCase() + '!');
        process.exit();
    }
});