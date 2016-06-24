// load mongoose since we need it to define a model
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var accountPlanSchema = new Schema({
	'dateCreated'	: String
});

var clientSchema = new Schema({ 
	'name' 			: String, 
	'cluster' 		: String, 
	'platform' 		: String, 
	'ui_version' 	: String,
	'displayCodes'	: Array,
	'expanded'		: Boolean
});

var brandSchema = new Schema({ 
	'name'			 	 : String,
	'clients' 		 	 : [ clientSchema ],
	'businessContacts'   : [ String ],
	'technicalContacts'  : [ String ]
});

var accountSchema = new Schema({
	'name'				: String,
	'brands'			: [ brandSchema ],
	'accountPlans'		: [ accountPlanSchema ],
	'accountDirector'   : String,
	'csd'				: String,
	'sd'				: String
});

module.exports = mongoose.model('Client', accountSchema);