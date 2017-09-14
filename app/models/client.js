// load mongoose since we need it to define a model
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// var accountPlanSchema = new Schema({
// 	'dateCreated'	: String
// });

// var clientSchema = new Schema({ 
// 	'name' 			: String, 
// 	'cluster' 		: String, 
// 	'platform' 		: String, 
// 	'ui_version' 	: String,
// 	'displayCodes'	: Array,
// 	'expanded'		: Boolean
// });

// var brandSchema = new Schema({ 
// 	'name'			 	 : String,
// 	'clients' 		 	 : [ clientSchema ],
// 	'businessContacts'   : [ String ],
// 	'technicalContacts'  : [ String ]
// });

// var accountSchema = new Schema({
// 	'name'				: String,
// 	'brands'			: [ brandSchema ],
// 	'accountPlans'		: [ accountPlanSchema ],
// 	'accountDirector'   : String,
// 	'csd'				: String,
// 	'sd'				: String
// });

var databaseSchema = new Schema({
	'clientName' 		 : String,
	'platform'			 : String,
	'cluster'			 : String,
	'platform' 			 : String, 
	'ui_version' 		 : String,
	'mainDisplayCode'	 : String,
	'expanded'			 : Boolean,
	'brandName'			 : String,
	'businessContacts'   : [ String ],
	'technicalContacts'  : [{
		'typeOfTechContact'  : String,
		'nameOfTechContact'	 : String
	}],
	'accountName'		 : String,
	'accountPlans'		 : [{
		'dateCreated'	      : String,
		'numOfInstances'      : Number,
		'numOfLocales'	      : Number,
		'platformUsed'	      : String,
		'hostedOrAPI'	      : String,
		'edr'			      : Boolean,
		'bvPixel'		      : Boolean,
		'bvAnalytics'	      : String,
		'productsUsed'	      : String,
		'currentTechState1'   : String,
		'currentTechState2'   : String,
		'currentTechState3'   : String,
		'currentTechState4'   : String,
		'lookingForward1'	  : String,
		'lookingForward2'	  : String,
		'lookingForward3'	  : String,
		'lookingForward4'	  : String,
		'lookingForward5'	  : String,
		'engagementOverview1' : String,
		'engagementOverview2' : String,
		'engagementOverview3' : String,
		'engagementOverview4' : String
	}],
	'accountDirector'    : String,
	'csd'				 : String,
	'sd'				 : String,
	'tsm'				 : String
});

module.exports = mongoose.model('Client', databaseSchema);