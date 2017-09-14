// load mongoose since we need it to define a model
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var auditSchema = new Schema({
	'accountName'		 : String,
	'brandName'			 : String,
	'clientName'		 : String,
	'platform'			 : String,
	'activeProducts' 	 : Number,
	'upcs'			 	 : Number,
	'eans'			 	 : Number,
	'catalogHealthScore' : Number,
	'bvPixel'			 : String,
	'syndication'		 : String
});

module.exports = mongoose.model('Audit', auditSchema);