// load mongoose since we need it to define a model
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var clientSchema = new Schema({ 
	name 		: String, 
	cluster 	: String, 
	platform 	: String, 
	ui_version 	: String,
	expanded	: Boolean
});

var accountSchema = new Schema({ 
	name		: String,
	clients 	: [ clientSchema ]
});

module.exports = mongoose.model('Client', accountSchema);