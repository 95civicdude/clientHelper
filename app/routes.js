// load the client model
var Client = require('./models/client');
var Audit = require('./models/audit');
var async = require('async');

// Need this for the server side call to Catalog API
var productHealth = require("./controllers/productHealth");


// This is stuff for Querying the BV Databases
// load the ElasticSearch for BV Database lookups
var elasticsearch = require('elasticsearch');
var dbClient = elasticsearch.Client({
    host: 'cstools-polloi-bazaar-409108554.us-east-1.elb.amazonaws.com:80'
})

// expose the routes to our app with module.exports
module.exports = function(app) {

    dbClient.ping({
        requestTimeout: 30000
    }, function(error) {
        if (error) {
            console.error('elasticsearch cluster is down!');
        } else {
            console.log('All is well with elasticsearch');
        }   
    });

    // api for CLIENTS ---------------------------------------------------------------------

    // create an account and send back all accounts after creation
    var addAccount = function(req, res, next) {
        
        Client.count({
            'brandName' : req.body.brandName
        }, function(err, count) {
            if (req.body.callType === 'client') {
                // Account already exists, let's go create an individual client instead
                next();
            } else if (req.body.callType === 'record' ) {
                // Create the entry in the database for this Client

                var childClients = {};
                var recordJSON = [];

                // look up the client by bundle in rosetta
                performRequest('rosetta.prod.us-east-1.nexus.bazaarvoice.com', '/search/1/client', 'GET', '?bundle=' + req.body.brandName, function(result){
                    
                    childClients = Object(result);

                    // build list of child client names to keep track
                    Object.keys(childClients).forEach(function(bigKey) {

                        recordJSON[bigKey] = {                     // Create our JSON document to represent the DB call later
                            'clientName'         : childClients[bigKey].name,
                            'cluster'            : childClients[bigKey].cluster,
                            'platform'           : childClients[bigKey].platform,
                            'ui_version'         : childClients[bigKey].ui_version,
                            'mainDisplayCode'    : "",
                            'expanded'           : false,
                            'brandName'          : req.body.brandName,
                            'businessContacts'   : [ ],
                            'technicalContacts'  : [ ],
                            'accountName'        : req.body.accountName,
                            'accountPlans'       : [ ],
                            'accountDirector'    : req.body.accountDirector,
                            'csd'                : "",
                            'sd'                 : "",
                            'tsm'                : ""
                        };
                    })

                    Client.create(recordJSON, function(err, account) {      // Using the JSON doc we can create our DB document in one call
                        
                        if (err)
                            console.log('there was an error creating the Account: ' + err);

                        Client.find(function(err, records) {
                            if (err)
                                res.send(err);
                            res.json(records);
                        });
                    });
                });
            } else if (req.body.callType === 'account') {
                // Create the Portfolio entry

                var accountJSON = {
                    'name'            : req.body.name,
                    'accountDirector' : req.body.accountDirector,
                    'csd'             : req.body.clientSuccessDirector,
                    'sd'              : req.body.salesDirector,
                    'brands'          : [],
                    'accountPlans'    : []
                };

                Client.create(accountJSON, function(err, account) {
                    // Use the JSON doc to create the database entry for this
                    // portfolio entry.

                    if (err)
                        console.log('there was an error creating the account: ' + err);

                    // get and return all the portfolio entries after create this one
                    Client.find(function(err, accounts) {
                        if (err)
                            res.send(err)
                        res.json(accounts);
                    });
                });
            } else if (count > 0) {
                // Account already exists, and someone clicked the "Create Account" button
                throw new Error('Oh no, you\'ve already created this brand');
            } else if (req.body.callType === 'brand') {

                var childClients = {};
                var brandJSON  = {
                    'name'              : '',
                    'clients'           : [],
                    'businessContacts'  : [],
                    'technicalContacts' : []
                };

                // look up the client by bundle in rosetta
                performRequest('rosetta.prod.us-east-1.nexus.bazaarvoice.com', '/search/1/client', 'GET', '?bundle=' + req.body.name, function(result){
                    
                    childClients = Object(result);
                    
                    brandJSON.name = req.body.name;


                    // build list of child client names to keep track
                    Object.keys(childClients).forEach(function(bigKey) {

                        brandJSON.clients[bigKey] = {                     // Create our JSON document to represent the DB call later
                            'name'        : childClients[bigKey].name,
                            'cluster'     : childClients[bigKey].cluster,
                            'platform'    : childClients[bigKey].platform,
                            'ui_version'  : childClients[bigKey].ui_version,
                            'expanded'    : false
                        };
                    })

                    Client.findOneAndUpdate({
                        '_id'  : req.body.parentId
                    }, {'$push': {'brands': brandJSON }
                    }, {
                        'safe'  : true,
                        'upsert': true
                    }, function(err, account) {      // Using the JSON doc we can create our DB document in one call
                        
                        if (err)
                            console.log('there was an error creating the brand: ' + err);

                        Client.findById( {
                            '_id' : account._id
                        }, function(err, account) {
                            if (err)
                                res.send(err)

                            res.json(account.brands);
                        });
                    });
                });
            } else {
                // Account already exists, and someone clicked the "Create Account" button
                throw new Error('Foolish one, something messed up in the routes.js addAccount function');
            }
        });
    }

    // manually add a client to an account and send back all clients for this account after creation
    var addClient = function(req, res) {

        // look up in Rosetta a specific client to add to my DB record for the account
        // format for the call: https://rosetta.prod.us-east-1.nexus.bazaarvoice.com/search/1/client/jomaloneaustralia
        performRequest('rosetta.prod.us-east-1.nexus.bazaarvoice.com', '/search/1/display', 'GET', '?client=' + req.body.text, function(result){

            theClient = Object(result[0]);

            clientJSON = {                             
                'name'               : theClient.client, 
                'cluster'            : theClient.cluster, 
                'platform'           : theClient.platform, 
                'ui_version'         : theClient.ui_version,
                'mainDisplayCode'    : theClient.code,
                'expanded'           : true
            };

            Client.findOneAndUpdate({
                'name' : theClient.bundle
            }, {'$push': { 'clients': clientJSON }        // hard-coded to set the 'bundle' field in the DB
            }, {
                'safe'  : true, 
                'upsert': true 
            }, function(err, client) {
                if (err)
                    res.send(err);

                Client.findById( {
                    '_id' : client._id
                }, function(err, client) {
                    if (err)
                        res.send(err)
                    res.json(client.clients);
                });
            });
        });
    }

    // expand a client to see all individual clients for this "bundle"
    var expand = function(req, res) {

        console.log(req.body)

        // look up in Rosetta a specific client to add to my DB record for the account
        // format for the call: https://rosetta.prod.us-east-1.nexus.bazaarvoice.com/search/1/client/jomaloneaustralia
        // performRequest('rosetta.prod.us-east-1.nexus.bazaarvoice.com', '/search/1/display', 'GET', '?client=' + req.body.text, function(result){

        //     theClient = Object(result[0]);

        //     clientJSON = {                             
        //         'name'               : theClient.client, 
        //         'cluster'            : theClient.cluster, 
        //         'platform'           : theClient.platform, 
        //         'ui_version'         : theClient.ui_version,
        //         'mainDisplayCode'    : theClient.code,
        //         'expanded'           : true
        //     };

        //     Client.findOneAndUpdate({
        //         'name' : theClient.bundle
        //     }, {'$push': { 'clients': clientJSON }        // hard-coded to set the 'bundle' field in the DB
        //     }, {
        //         'safe'  : true, 
        //         'upsert': true 
        //     }, function(err, client) {
        //         if (err)
        //             res.send(err);

        //         Client.findById( {
        //             '_id' : client._id
        //         }, function(err, client) {
        //             if (err)
        //                 res.send(err)
        //             res.json(client.clients);
        //         });
        //     });
        // });

        // var client = req.body;

        // if (client.callType === 'account') {
        //     Client.findById(req.params.client_id, function(err, account) {
        //         if (err)
        //             res.send(err);

        //         res.json(account.brands);
        //     });
        // } else if (client.callType === 'brand') {

        //     Client.findOne({
        //             'brands.name': client.data.name
        //     }, function(err, brand) {
        //         if (err)
        //             res.send(err);

        //         var theActualBrand = brand.brands.id(client.data._id); // needed to get the specific brand from the DB using the it's id
        //         res.json(theActualBrand.clients);
        //     });
        // }
    }

    // search for all display codes for all clients in an account
    var findClientDisplayCodes = function(req, res) {

        client = req.body;
        console.log(client);
        parentId = req.body.parentId;
        displayCodesJSON = [];

        if (client.expanded == false) {

            performRequest('rosetta.prod.us-east-1.nexus.bazaarvoice.com', '/search/1/display', 'GET', '?client=' + client.name, function(result){

                displayCodes = Object(result);

                // build list of display codes for this client
                Object.keys(displayCodes).forEach(function(bigKey) {

                    displayCodesJSON.push(displayCodes[bigKey].code);
                })

                // The tough part of finding and updating the right one based on the parent ID AND the child ID
                Client.findOneAndUpdate({
                    'brands' : {
                        '$elemMatch': {
                            '_id': client.parentId,
                            'clients': {
                                '$elemMatch': { 
                                    'name': client.name 
                                }    
                            }
                        }
                    }
                }, {'$push': {
                        'clients.$.displayCodes': {$each: displayCodesJSON}
                    },
                    '$set' : {
                        'clients.$.expanded' : true
                    }
                }, {
                    'safe'  : true, 
                    'upsert': true 
                }, function(err, brand) {
                    if (err)
                        res.send(err);

                    //console.log(client);
                    
                    Client.find({
                        'brands' : {
                            '$elemMatch': {
                                '_id': client.parentId  
                            }
                        }
                        
                    }, function(err, brand) {
                        if (err)
                            res.send(err);

                        console.log(brand);
                        res.json(brand.clients);
                    });
                });
            })
        }
    }

    // update a client with new data
    var updateRecord = function(req, res) {

        if (req.body.clientData.callType === 'accountTeamMember') {

            var teamMemberType = req.body.clientData.teamMemberType;
            var newTeamMember = req.body.clientData.newTeamMember;

            var updateJSON = {};
            updateJSON[teamMemberType] = newTeamMember;

            Client.update({
                'accountName': req.body.dbDocument.accountName
            }, {
                '$set': updateJSON
            }, {
                multi: true
            }, function(err, dbDocument) {
                if (err)
                    res.send(err);

                // get and return all clients after updating it
                Client.find(function(err, dbDocuments) {
                    if (err)
                        res.send(err)
                    res.json(dbDocuments);
                });
            });
        } else if (req.body.clientData.callType === 'techTeamMember') {

            var teamMemberType = req.body.clientData.typeOfTechContact;
            var newTeamMember = req.body.clientData.nameOfTechContact;

            var updateJSON = {};
            updateJSON = {
                'typeOfTechContact' : teamMemberType,
                'nameOfTechContact' : newTeamMember
            };

            Client.update({
                'brandName': req.body.dbDocument.brandName
            }, {
                '$push': {
                    'technicalContacts' : updateJSON
                }
            }, {
                upsert: true,
                multi: true,
                new: true
            }, function(err, dbDocument) {
                if (err)
                    res.send(err);

                // get and return all clients after updating it
                Client.find(function(err, dbDocuments) {
                    if (err)
                        res.send(err)
                    res.json(dbDocuments);
                });
            });
        } else if (req.body.clientData.callType === 'addClientHomePage') {
            // Make a call to rosetta to search for 
        }
    }

    var createTechPlan = function(req, res) {

        var edrYesOrNo = false;

        if (req.body.clientData.edrYes) {
            edrYesOrNo = true;
        } else if (req.body.clientData.edrNo) {
            edrYesOrNo = false;
        }

        var updateJSON = {
            'dateCreated'         : (new Date).toLocaleDateString(),
            'numOfInstances'      : req.body.clientData.numOfInstances,
            'numOfLocales'        : req.body.clientData.numOfLocales,
            'platformUsed'        : req.body.clientData.platformUsed,
            'hostedOrAPI'         : req.body.clientData.hostedOrAPI,
            'edr'                 : edrYesOrNo,
            'bvPixel'             : false,
            'bvAnalytics'         : '',
            'productsUsed'        : req.body.clientData.productsUsed,
            'currentTechState1'   : req.body.clientData.currentTechState1,
            'currentTechState2'   : req.body.clientData.currentTechState2,
            'currentTechState3'   : req.body.clientData.currentTechState3,
            'currentTechState4'   : req.body.clientData.currentTechState4,
            'lookingForward1'     : req.body.clientData.lookingForward1,
            'lookingForward2'     : req.body.clientData.lookingForward2,
            'lookingForward3'     : req.body.clientData.lookingForward3,
            'lookingForward4'     : req.body.clientData.lookingForward4,
            'lookingForward5'     : req.body.clientData.lookingForward5,
            'engagementOverview1' : req.body.clientData.engagementOverview1,
            'engagementOverview2' : req.body.clientData.engagementOverview2,
            'engagementOverview3' : req.body.clientData.engagementOverview3,
            'engagementOverview4' : req.body.clientData.engagementOverview4            
        };

        Client.update({
            'accountName': req.body.dbDocument.accountName
        }, {
            '$push': {
                'accountPlans' : updateJSON
            }
        }, {
            upsert: true,
            multi: true,
            new: true
        }, function(err, dbDocument) {
            if (err)
                res.send('you messed up: ' + err);

                // get and return all clients after updating it
                Client.find(function(err, dbDocuments) {
                    if (err)
                        res.send(err)
                    res.json(dbDocuments);
                });
        });
    }

    // makes an api call to rosetta to get client bundle information based on the client name
    function performRequest(theHost, endpoint, method, data, success) {

        var https      = require('https');
        var host       = theHost;
        var headers    = {}; 
        var dataString = JSON.stringify(data);
        
        if (method == 'GET') {
            endpoint += data;
        }
        else {
            headers = {
                'Content-Type'  : 'application/json',
                'Content-Length': dataString.length
            };
        }
        var options = {
            'host'   : host,
            'path'   : endpoint,
            'method' : method,
            'headers': headers
        };
        var req = https.request(options, function(res) {

            res.setEncoding('utf-8');

            var responseString = '';

            res.on('data', function(data) {
                responseString += data;
            });

            res.on('end', function() {

                var responseObject = JSON.parse(responseString);
                success(responseObject);
            });

        });

        req.on('error', (e) => {
            console.log('there was a problem in the \'performRequest\' function');
        });
        req.end();
    }


    // ------------------------------- ELASTICSEARCHSTUFF -------------------------------
    // get the count of all active products in the DB for given client.
    // uses ElasticSearch and Client Delivery Palloi cluster
    app.get('/api/search/:clientName', function(req, res) {

        var str = req.params.clientName;

        dbClient.count({
            index: '!catalog:' + str.toLowerCase() + ':',
            body: {
                query: {
                    constant_score: {
                        filter: {
                            bool: {
                                must: [
                                    {'term' : {'type' : 'product'}},
                                    {'term' : {'active' : 'true'}}
                                ]
                            }
                        }
                    }
                }
            }
        }).then(function (response) {
            
            res.json(response);
        }, function (error) {
            console.trace(error.message)
        });

    });


    // ------------------------------- END ELASTICSEARCH STUFF -------------------------------

    // get all clients
    app.get('/api/clients', function(req, res) {

        // use mongoose to get all clients in the DB
        Client.find(function(err, accounts) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(accounts); // return all clients in JSON format
        });
    });
    // get list of brand clients in account
    // NOTE: as of 2/16/17 this works with new style of UI (tiled approach).
    app.get('/api/clients/:accountName', function(req, res) {

        // use mongoose to get all brands with matching accountName
        if (req.query.callType === 'brands' || req.query.callType === 'audit') {
            Client.find({
                'accountName' : req.params.accountName
            }, function(err, client) {
                if (err)
                    res.send(err);
                
                res.json(client);
            });    
        } else if (req.query.callType === 'clients') {
            Client.find({
                'brandName' : req.params.accountName
            }, function(err, client) {
                if (err)
                    res.send(err);
                
                res.json(client);
            });
        }        
    });
    // monitor client deployments
    app.post('/api/clientMonitor', function(req, res) {
        console.log('here');

        performRequest('config.bazaarvoice.com', '/api/v1/client', 'GET', '?name=' + 'smashbox-global', function(result){
            //console.log(result);
        });
    });
    // Creation Posts for both the account and clients
    app.post('/api/clients', [addAccount, addClient]);
    // 'Expanding' a client when they first click on the details button
    app.post('/api/clients/:client_id', [expand]);
    // Updating the client record with a list of all the display codes
    app.post('/api/clients/:client_id/displayCodes', [findClientDisplayCodes]);
    // update a client and send back all clients after creation
    app.post('/api/clients/:client_id', function(req, res) {

        // Client.findByIdAndUpdate({
        //     _id : req.params.client_id
        // }, {$set: { bundle: req.body.text}        // hard-coded to set the 'bundle' field in the DB
        // }, function(err, client) {
        //     if (err)
        //         res.send(err);

        //     // get and return the client after updating it
        //     Client.find(function(err, clients) {
        //         if (err)
        //             res.send(err)
        //         res.json(clients);
        //     });
        // });
    });
    // create a tech plan for the client
    app.post('/api/techPlan', [createTechPlan]);
    // update a client record
    app.put('/api/clients/:client_id', [updateRecord]);
    // delete a client
    app.delete('/api/clients/:client_id', function(req, res) {

        Client.remove({
            accountName : req.query.accountName
        }, function(err, dbDocument) {
            if (err)
                res.send(err);

            // get and return all the Accounts after you delete one
            Client.find(function(err, dbDocuments) {
                if (err)
                    res.send(err)
                res.json(dbDocuments);
            });
        });
    });

    // Using this to ping the Catalog API for Product Feed health
    app.route('/api/products')
        .get(productHealth.getProductResults);



    // get all audits
    app.get('/api/audits', function(req, res) {

        // use mongoose to get all audits in the DB
        Audit.find(function(err, audits) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(audits); // return all audit documents in JSON format
        });
    });
    // Ideas for API routes
    // ================================================
    //app.get('/api/v1/accounts.json?id=:client_id')
    //app.get('/api/v1/accounts.json?')

    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};