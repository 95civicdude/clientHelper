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

				$scope.showDiv('../../templates/accountPanel.html');
            });

		// CREATE ACCOUNT===========================================================
        // when submitting the add form, send the text to the node API
        $scope.createAccount = function() {

            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same client anymore
            if (!$.isEmptyObject($scope.formData)) {

            	$scope.formData.callType = 'account';
                // call the create function from our service (returns a promise object)
                Clients.createAccount($scope.formData)

                    // if successful creation, call our get function to get all the new clients
                    .success(function(data) {
                        $scope.formData = {}; // clear the form so our user is ready to enter another
                        $scope.clients = data; // assign our new list of clients
                    });
            }
        };

		// CREATE ==================================================================
        // when submitting the add form, send the text to the node API
        $scope.createClient = function() {

            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same client anymore
            if (!$.isEmptyObject($scope.formData)) {

        		$scope.formData.callType  = 'client';
        		$scope.formData.accountId = $scope.clients._id;
                // call the create function from our service (returns a promise object)
                Clients.createClient($scope.formData)

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
                    $scope.clients = data;		// assign our new list of clients
                });
        };

        // EXPAND CLIENT ===========================================================
        // shows all clients within the specified bundle
        $scope.expandClient = function(id) {

        	$scope.parentId = id;
        	
        	Clients.expandClient(id)

        		.success(function(data) {
        			$scope.clients = data;
        			$scope.showDiv('../../templates/clientPanel.html');
        		});
        };

        $scope.returnClient = function() {
        	
        	Clients.get()

        		.success(function(data) {
        			$scope.clients = data;
        			$scope.showDiv('../../templates/accountPanel.html');
        		});
        };

        $scope.showDiv = function(nameOfTemplate) {
        	$scope.templateUrl = nameOfTemplate;
        }
    })
    // .directive('chAccount', function() {
    // 	return {
    // 		restrict: 'E',
    // 		templateUrl: '../../templates/accountPanel.html'
    // 	};
    // });