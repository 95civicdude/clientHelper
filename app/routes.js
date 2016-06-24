// load the client model
var Client = require('./models/client');

var async = require('async');

// expose the routes to our app with module.exports
module.exports = function(app) {

    // api for CLIENTS ---------------------------------------------------------------------

    // create an account and send back all accounts after creation
    var addAccount = function(req, res, next) {
        
        Client.count({
            'name' : req.body.accountName
        }, function(err, count) {
            if (req.body.callType === 'client') {
                // Account already exists, let's go create an individual client instead
                next();
            } else if (req.body.callType === 'account') {
                // Create the Portfolio entry

                var portfolioJSON = {
                    'name'            : req.body.accountName,
                    'accountDirector' : req.body.accountDirector,
                    'csd'             : req.body.clientSuccessDirector,
                    'sd'              : req.body.salesDirector,
                    'brands'        : [],
                    'accountPlans'    : []
                };

                Client.create(portfolioJSON, function(err, account) {
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
                performRequest('/search/1/client', 'GET', '?bundle=' + req.body.brandName, function(result){
                    
                    childClients = Object(result);
                    
                    brandJSON.name = req.body.brandName;

                    console.log(req.body);

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
                    }, function(err, client) {      // Using the JSON doc we can create our DB document in one call
                        
                        if (err)
                            console.log('there was an error creating the brand: ' + err);

                        Client.findById( {
                            '_id' : client._id
                        }, function(err, client) {
                            if (err)
                                res.send(err)
                            res.json(client.clients);
                        });
                    });
                });

            } else {
                // Account already exists, and someone clicked the "Create Account" button
                throw new Error('Foolish one, something messed up in the routes.js add function');
            }
        });
    }

    // manually add a client to an account and send back all clients for this account after creation
    var addClient = function(req, res) {

        // look up in Rosetta a specific client to add to my DB record for the account
        // format for the call: https://rosetta.prod.us-east-1.nexus.bazaarvoice.com/search/1/client/jomaloneaustralia
        performRequest('/search/1/client', 'GET', '/' + req.body.text, function(result){

            theClient = Object(result[0]);

            clientJSON = {                             
                'name'        : theClient.name, 
                'cluster'     : theClient.cluster, 
                'platform'    : theClient.platform, 
                'ui_version'  : theClient.ui_version,
                'expanded'    : true
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
    var expandClient = function(req, res) {

        var client = req.body;
        console.log(req);
        //console.log(client);

        if (client.callType === 'account') {
            Client.findById(req.params.client_id, function(err, account) {
                if (err)
                    res.send(err);

                res.json(account.brands);

                //clients = client.clients;
                // Object.keys(clients).forEach(function (bigKey) {

                //     if (clients[bigKey].expanded == false) {

                //         clients[bigKey].expanded = true;
                //     }

                //     client.clients[bigKey] = clients[bigKey];
                // });

                // client.save();

                // get and return all the clients after you create another
                // Client.findById(req.params.client_id, function(err, clients) {
                //     if (err)
                //         res.send(err);
                //     res.json(clients.clients);
                // });
            });
        } else if (client.callType === 'brand') {
            Client.findById(req.params.client_id, function(err, client) {
                if (err)
                    res.send(err);

                res.json(client.clients);

                //clients = client.clients;
                // Object.keys(clients).forEach(function (bigKey) {

                //     if (clients[bigKey].expanded == false) {

                //         clients[bigKey].expanded = true;
                //     }

                //     client.clients[bigKey] = clients[bigKey];
                // });

                // client.save();

                // get and return all the clients after you create another
                // Client.findById(req.params.client_id, function(err, clients) {
                //     if (err)
                //         res.send(err);
                //     res.json(clients.clients);
                // });
            });
        }
    }

    // search for all display codes for all clients in an account
    var findClientDisplayCodes = function(req, res) {

        client = req.body;
        parentId = req.body.parentId;
        displayCodesJSON = [];

        if (client.expanded == false) {

            performRequest('/search/1/display', 'GET', '?client=' + client.name, function(result){

                displayCodes = Object(result);

                // build list of display codes for this client
                Object.keys(displayCodes).forEach(function(bigKey) {

                    displayCodesJSON.push(displayCodes[bigKey].code);
                })

                // The tough part of finding and updating the right one based on the parent ID AND the child ID
                Client.findOneAndUpdate({
                    'clients': {
                        '$elemMatch': { 'name': client.name }    
                    }
                }, {'$push': {
                        'clients.$.displayCodes' : {$each: displayCodesJSON}
                    },
                    '$set' : {
                        'clients.$.expanded'     : true
                    }
                }, {
                    'safe'  : true, 
                    'upsert': true 
                }, function(err, client) {
                    if (err)
                        res.send(err);
                    
                    Client.findById(parentId, function(err, client) {
                        if (err)
                            res.send(err);
                        res.json(client.clients);
                    });
                });
            })
        }
    }

    // makes an api call to rosetta to get client bundle information based on the client name
    function performRequest(endpoint, method, data, success) {

        var https      = require('https');
        var host       = 'rosetta.prod.us-east-1.nexus.bazaarvoice.com';
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

    // get all clients
    app.get('/api/clients', function(req, res) {
        // use mongoose to get all clients in the DB
        Client.find(function(err, clients) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(clients); // return all clients in JSON format
        });
    });
    // Creation Posts for both the account and clients
    app.post('/api/clients', [addAccount, addClient]);
    // 'Expanding' a client when they first click on the details button
    app.post('/api/accounts/:client_id', [expandClient]);
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
    // delete a client
    app.delete('/api/clients/:client_id', function(req, res) {
        Client.remove({
            _id : req.params.client_id
        }, function(err, client) {
            if (err)
                res.send(err);

            // get and return all the clients after you create another
            Client.find(function(err, clients) {
                if (err)
                    res.send(err)
                res.json(clients);
            });
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