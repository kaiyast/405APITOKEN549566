var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('users', new Schema({ 
	name: String, 
    email: String,
    age: Number,
    password: String,
    admin: Boolean
}));