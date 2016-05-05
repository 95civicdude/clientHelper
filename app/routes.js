// load the todo model
var Todo = require('./models/todo');

// load the client model
var Client = require('./models/client');

// expose the routes to our app with module.exports
module.exports = function(app) {

	// api for TODOS ---------------------------------------------------------------------
    // get all todos
    app.get('/api/todos', function(req, res) {

        // use mongoose to get all todos in the database
        Todo.find(function(err, todos) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(todos); // return all todos in JSON format
        });
    });

    // create todo and send back all todos after creation
    app.post('/api/todos', function(req, res) {

        // create a todo, information comes from AJAX request from Angular
        Todo.create({
            text : req.body.text,
            done : false
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Todo.find(function(err, todos) {
                if (err)
                    res.send(err)
                res.json(todos);
            });
        });

    });

    // delete a todo
    app.delete('/api/todos/:todo_id', function(req, res) {
        Todo.remove({
            _id : req.params.todo_id
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Todo.find(function(err, todos) {
                if (err)
                    res.send(err)
                res.json(todos);
            });
        });
    });

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

    // create a client and send back all clients after creation
    app.post('/api/clients', function(req, res) {

        // create a client, information comes from AJAX request from Angular
        Client.create({
            databaseName : req.body.text
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

    // update a client and send back all clients after creation
    app.post('/api/clients/:client_id', function(req, res) {

        Client.findByIdAndUpdate({
            _id : req.params.client_id
        }, {$set: { databaseName: req.body.text}        // hard-coded to set the 'databaseName' field in the DB
        }, function(err, client) {
            if (err)
                res.send(err);

            // get and return the client after updating it
            Client.find(function(err, clients) {
                if (err)
                    res.send(err)
                res.json(clients);
            });
        });
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


    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};