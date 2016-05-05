angular.module('appClientController', [])

	// inject the Client service factory into our controller
	.controller('ClientCtrl', function($scope, $http, Clients) {
		$scope.formData = {};

		// GET =====================================================================
        // when landing on the page, get all clients and show them
        // use the service to get all the clients
		Clients.get()
            .success(function(data) {
                $scope.clients = data;
            });

        $.get('https://rosetta.prod.us-east-1.nexus.bazaarvoice.com/search/1/client?bundle=hanesbrands', function(res) {
            console.log('ajax success');
            console.log(JSON.stringify(res));
        });

		// CREATE ==================================================================
        // when submitting the add form, send the text to the node API
        $scope.createClient = function() {

            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same client anymore
            if (!$.isEmptyObject($scope.formData)) {

                // call the create function from our service (returns a promise object)
                Clients.create($scope.formData)

                    // if successful creation, call our get function to get all the new clients
                    .success(function(data) {
                        $scope.formData = {}; // clear the form so our user is ready to enter another
                        $scope.clients = data; // assign our new list of clients
                    });
            }
        };

        // UPDATE ==================================================================
        // for editing a client record
        $scope.updateClient = function(id) {
        	if (!$.isEmptyObject($scope.formData)) {

        		// update the client record using the function from our service (returns a promise object)
        		Clients.update(id, $scope.formData)

        			.success(function(data) {
        				$scope.formData = {};	// clear the form so our user is ready to enter more updates
        				$scope.clients = data;	// assign our new client data
        			});	
        	}
        };

		// DELETE ==================================================================
        // delete a client after checking it
        $scope.deleteClient = function(id) {
            Clients.delete(id)
                // if successful creation, call our get function to get all the new clients
                .success(function(data) {
                    $scope.clients = data; // assign our new list of clients
                });
        };
    });