// load the todo model
var Todo = require('./models/todo');

// load the client model
var Client = require('./models/client');

var async = require('async');

// expose the routes to our app with module.exports
module.exports = function(app) {

    // api for CLIENTS ---------------------------------------------------------------------
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

    // create an account and send back all accounts after creation
    var addAccount = function(req, res, next) {
        
        Client.count({
            name : req.body.text
        }, function(err, count) {
            if (req.body.callType === 'client') {
                // Account already exists, let's go create an individual client instead
                next();
            } else if (count > 0) {
                // Account already exists, and someone clicked the "Create Account" button
                throw new Error('Oh no, you\'ve already created this account');
            } else {

                var childClients = {};
                var accountJSON  = {
                    name    : '',
                    clients : []
                };

                // look up the client by bundle in rosetta
                performRequest('/search/1/client', 'GET', '?bundle=' + req.body.text, function(result){
                    
                    childClients = Object(result);
                    
                    accountJSON.name = childClients[0].bundle;

                    // build list of child client names to keep track
                    Object.keys(childClients).forEach(function(bigKey) {

                        accountJSON.clients[bigKey] = {                     // Create our JSON document to represent the DB call later
                            name        : childClients[bigKey].name,
                            cluster     : childClients[bigKey].cluster,
                            platform    : childClients[bigKey].platform,
                            ui_version  : childClients[bigKey].ui_version,
                            expanded    : false
                        };
                    })

                    Client.create(accountJSON, function(err, client) {      // Using the JSON doc we can create our DB document in one call
                        
                        if (err)
                            console.log('there was an error: ' + err);

                        // get and return all the clients after you create another
                        Client.find(function(err, clients) {
                            if (err)
                                res.send(err)
                            res.json(clients);
                        });
                    });
                });
            }
        });
    }

    // manually add a client to an account and send back all clients for this account after creation
    var addClient = function(req, res) {

        // look up in Rosetta a specific client to add to my DB record for the account
        // format for the call: https://rosetta.qa.us-east-1.nexus.bazaarvoice.com/search/1/client/jomaloneaustralia
        performRequest('/search/1/client', 'GET', '/' + req.body.text, function(result){

            theClient = Object(result[0]);

            clientJSON = {                             
                name        : theClient.name, 
                cluster     : theClient.cluster, 
                platform    : theClient.platform, 
                ui_version  : theClient.ui_version,
                expanded    : true
            };

            Client.findOneAndUpdate({
                name : theClient.bundle
            }, {$push: { clients: clientJSON }        // hard-coded to set the 'bundle' field in the DB
            }, {
                safe: true, 
                upsert: true 
            }, function(err, client) {
                if (err)
                    res.send(err);

                // PICK IT UP BACK HERE. TRYING TO FIGURE OUT HOW TO SHOW THE CLIENTS AFTER ADDING TO THE ARRAY RECORD
                res.json(client.clients);
                // get and return the client after updating it
                // Client.findOne( {
                //     name : theClient.bundle
                // }, function(err, clients) {
                //     if (err)
                //         res.send(err)
                //     res.json(clients.clients);
                // });
            });
        });
    }
    app.post('/api/clients', [addAccount, addClient]);

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

    // expand a client to see all individual clients for this "bundle"
    app.get('/api/clients/:client_id', function(req, res) {
        var clients = {};

        Client.findById(req.params.client_id, function(err, client) {
            if (err)
                res.send(err);

            clients = client.clients;
            Object.keys(clients).forEach(function (bigKey) {

                if (clients[bigKey].expanded == false) {

                    // request client info from Rosetta to update DB (should only do this the first time accessing this code)
                    //performRequest('','','', function(result) {

                        clients[bigKey].expanded = true;
                    //});
                    // performRequest('/search/1/client', 'GET', 'bundle=' + req.body.text, function(result){
            
                    //     childClients = Object(result);
                        
                    //     accountJSON.name = childClients[0].bundle;

                    //     // build list of child client names to keep track
                    //     Object.keys(childClients).forEach(function(bigKey) {

                    //         accountJSON.clients[bigKey] = {                     // Create our JSON document to represent the DB call later
                    //             name        : childClients[bigKey].name,
                    //             cluster     : childClients[bigKey].cluster,
                    //             platform    : childClients[bigKey].platform,
                    //             ui_version  : childClients[bigKey].ui_version,
                    //             expanded    : false
                    //         };
                    //     })

                    //     Client.create(accountJSON, function(err, client) {      // Using the JSON doc we can create our DB document in one call
                            
                    //         if (err)
                    //             console.log('there was an error: ' + err);

                    //         // get and return all the clients after you create another
                    //         Client.find(function(err, clients) {
                    //             if (err)
                    //                 res.send(err)
                    //             res.json(clients);
                    //         });
                    //     });
                        
                    // });
                }

                client.clients[bigKey] = clients[bigKey];
            });

            client.save();

            // get and return all the clients after you create another
            Client.findById(req.params.client_id, function(err, clients) {
                if (err)
                    res.send(err);
                res.json(clients.clients);
            });
        });
    });

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
                'Content-Type': 'application/json',
                'Content-Length': dataString.length
            };
        }
        var options = {
            host: host,
            path: endpoint,
            method: method,
            headers: headers
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
                //console.log(responseObject);
            });

        });

        req.on('error', (e) => {
            console.log('there was a problem in the \'performRequest\' function');
        });
        req.end();
    }

    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};