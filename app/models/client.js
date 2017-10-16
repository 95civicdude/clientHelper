// load mongoose since we need it to define a model
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var databaseSchema = new Schema({
	'clientName' 		 : String,
	'platform'			 : String,
	'cluster'			 : String,
	'ui_version' 		 : String,
	'brandName'			 : String,
	'accountName'		 : String,
	'accountDirector'    : String
}, {
	collection: "clients"
});

module.exports = mongoose.model('Client', databaseSchema);