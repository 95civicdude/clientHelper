angular.module('appClientController', [])

	// inject the Client service factory into our controller
	.controller('ClientCtrl', function($scope, $http, Clients) {
		$scope.formData = {};

		// GET =====================================================================
        // when landing on the page, get all clients and show them
        // use the service to get all the clients
		Clients.get()
            .success(function(data) {
                $scope.accounts = data;

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
                        $scope.formData = {};   // clear the form so our user is ready to enter another
                        $scope.accounts = data; // assign our new list of clients
                    });
            }
        };

		// CREATE ACCOUNT===========================================================
        // when submitting the add form, send the text to the node API
        $scope.createBrand = function() {

            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same client anymore
            if (!$.isEmptyObject($scope.formData)) {

            	$scope.formData.callType  = 'brand';
                $scope.formData.parentId  = $scope.parentId; // This comes from '.success of the expandClient function'
                //$scope.formData.accountId = $scope.client._id; 
                // call the create function from our service (returns a promise object)
                Clients.createAccount($scope.formData)

                    // if successful creation, call our get function to get all the new clients
                    .success(function(data) {
                        $scope.formData = {};   // clear the form so our user is ready to enter another
                        $scope.clients  = data; // assign our new list of clients
                    });
            }
        };

		// CREATE CLIENT============================================================
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
        $scope.expandClient = function(id, client, panelToShow, callType) {

            if ($.isEmptyObject(client)) {
                client = {};
            }
            client.callType = callType;

        	Clients.expandClient(id, client)

        		.success(function(data) {
        			$scope.parentId = id;

                    if (callType === 'account') {
                        console.log('account is the thing');
                        $scope.brands = data;
                    } else if (callType === 'brand') {
                        $scope.clients = data;
                    }
        			$scope.showDiv(panelToShow);
        		});
        };

        // DISPLAY CODDE UPDATE ====================================================
        // Looks at a client and adds display code information if it does not yet exist
        $scope.displayCodes = function(client, parentId) {
        	
        	client.parentId = parentId;
        	Clients.displayCodes(client)

        		.success(function(data) {
        			$scope.clients = data;
        		});
        };

        $scope.returnClient = function(panelToShow) {
        	
        	Clients.get()

        		.success(function(data) {
        			$scope.clients = data;
        			$scope.showDiv(panelToShow);
        		});
        };

        $scope.showDiv = function(nameOfTemplate) {
        	$scope.templateUrl = nameOfTemplate;
        }
    })