// load the client model
var Client = require('./models/client');
var ClientList = require('./models/clientlist');
var async = require('async');


// This is stuff for Querying the BV Databases
// load the ElasticSearch for BV Database lookups
// KEEP THIS FOR DOING QUERIES ON THE DATABASES
// var elasticsearch = require('elasticsearch');
// var dbClient = elasticsearch.Client({
//     host: 'cstools-polloi-bazaar-409108554.us-east-1.elb.amazonaws.com:80'
// })

// expose the routes to our app with module.exports
module.exports = function(app) {

    // dbClient.ping({
    //     requestTimeout: 30000
    // }, function(error) {
    //     if (error) {
    //         console.error('elasticsearch cluster is down!');
    //     } else {
    //         console.log('All is well with elasticsearch');
    //     }   
    // });

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
                            'brandName'          : req.body.brandName,
                            'accountName'        : req.body.accountName,
                            'accountDirector'    : req.body.accountDirector
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
    };

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
                        res.send(err);
                    res.json(client.clients);
                });
            });
        });
    };

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
                        res.send(err);
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
    };

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
    // app.get('/api/search/:clientName', function(req, res) {

    //     var str = req.params.clientName;

    //     dbClient.count({
    //         index: '!catalog:' + str.toLowerCase() + ':',
    //         body: {
    //             query: {
    //                 constant_score: {
    //                     filter: {
    //                         bool: {
    //                             must: [
    //                                 {'term' : {'type' : 'product'}},
    //                                 {'term' : {'active' : 'true'}}
    //                             ]
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }).then(function (response) {
            
    //         res.json(response);
    //     }, function (error) {
    //         console.trace(error.message)
    //     });

    // });


    // ------------------------------- END ELASTICSEARCH STUFF -------------------------------

    // get all clients
    app.get('/api/clients', function(req, res) {

        // use mongoose to get all clients in the DB
        Client.find(function(err, accounts) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err);

            res.json(accounts); // return all clients in JSON format
        });
    });

    // get list of all clients for typeahead suggestion engine
    app.get('/api/clientList', function(req, res) {
        ClientList.find(function(err, clients) {
                
                // if there's an error, capture it and output it
                if (err)
                    res.send(err);
    
                // return all clients in JSON format, for the typeahead suggestion engine
                res.json(clients);
            });
    });
    // get list of brand clients in account
    // NOTE: as of 2/16/17 this works with new style of UI (tiled approach).
    app.get('/api/clients/:accountName', function(req, res) {

        // use mongoose to get all brands with matching accountName
        if (req.query.callType === 'brands') {
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

    // Creation Posts for both the account and clients
    app.post('/api/clients', [addAccount, addClient]);
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

    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};