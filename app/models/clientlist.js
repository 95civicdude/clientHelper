// load mongoose since we need it to define a model
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var clientListSchema = new Schema({
	'name' 		 : String,
	'cluster'	 : String,
	'platform'	 : String
}, {
    collection: "clientList"
});

module.exports = mongoose.model('ClientList', clientListSchema);