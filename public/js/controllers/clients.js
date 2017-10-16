angular.module('appClientController', [])

	// inject the Client service factory into our controller
	.controller('ClientCtrl', function($scope, $http, $filter, $window, $timeout, Clients) {
		$scope.formData = {};

        Clients.getClientList()
            .then(function(data) {
                $scope.clientList = data;

                $scope.$broadcast('dataloaded');
            });

		// GET =====================================================================
        // when landing on the page, get all clients and show them
        // use the service to get all the clients
		Clients.get()
            .success(function(data) {
                $scope.dbDocuments = data;

				$scope.showDiv('../../templates/testingPanel.html');
            });

        $scope.createRecord = function(panelToShow, accountName = {} ) {

            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same client anymore
            if (!$.isEmptyObject($scope.formData)) {

                $scope.formData.callType = 'record';

                if ($.isEmptyObject(accountName)) {
                    // call the create function from our service (returns a promise object)
                    Clients.create($scope.formData)

                        // if successful creation, call our get function to get all the new clients
                        .success(function(data) {
                            $scope.formData = {};   // clear the form so our user is ready to enter another
                            $scope.dbDocuments = data; // assign our new list of clients
                        });
                } else {
                    $scope.formData.accountName = accountName;
                    $scope.currentAccount = accountName;

                    // call the create function from our service (returns a promise object)
                    Clients.create($scope.formData)

                        // if successful creation, call our get function to get all the new clients
                        .success(function(data) {
                            $scope.formData = {};   // clear the form so our user is ready to enter another
                            $scope.dbDocuments = data; // assign our new list of clients

                            $scope.showDiv('../../templates/' + panelToShow + '.html');
                        });
                }
            }
        };

        // UPDATE ==================================================================
        // for editing a client record
        $scope.updateClient = function(id) {
        	if (!$.isEmptyObject($scope.formData)) {

        		// update the client record using the function from our service (returns a promise object)
        		Clients.updateOLD(id, $scope.formData)

        			.success(function(data) {
        				$scope.formData = {};	// clear the form so our user is ready to enter more updates
        				$scope.clients = data;	// assign our new client data
        			});	
        	}
        };

        // DELETE ==================================================================
        // delete a client after checking it
        $scope.deleteRecord = function(dbDocument) {
            Clients.delete(dbDocument)

                // if successful creation, call our get function to get all the Records
                .success(function(data) {
                    $scope.dbDocuments = data;      // assign our new list of Records
                });
        };

        // Returned 'data' field is a JSON Object. We need to drill down to data.data to get
        // the actual data portion (dbDocuments) that the application is expecting. It's easier to
        // add that step here, just in case we ever need the other items returned in 'data'
        // (which the most important one I can think of would be the 'config' JSON object)
        $scope.doStuff = function(accountName, pageToLoad, callType) {

            Clients.getBrands(accountName, callType)
            .then(function(data) {
                $scope.dbDocuments = data.data;
                if (callType == "brands") {
                    $scope.currentAccount = data.data[0].accountName;
                } else if (callType == "clients") {
                    $scope.currentAccount = data.data[0].brandName;
                }
                $scope.showDiv('../../templates/' + pageToLoad + '.html');
            })
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
        };

        $scope.getDatetime = function() {
            return (new Date).toLocaleDateString();
        };

    })

    // CUSTOM ANGULAR FILTERS ======================================================
    // This filter is used to return mongoDB docs that part of the "Account" based on
    // their .accountName
    .filter('brandsInAccount', function() {
        return function(data, accountName) {

            returnedJSON = {};

            Object.keys(data).forEach(function(bigKey) {

                if (data[bigKey].accountName == accountName) {
                    returnedJSON[bigKey] = data[bigKey];
                }
            })
            return returnedJSON;
        }
    })

    .filter('filterByAccount', function() {
        return function(data, accountName) {

            returnedJSON = {};

            Object.keys(data).forEach(function(bigKey) {

                if (data[bigKey].accountName == accountName) {
                    returnedJSON[bigKey] = data[bigKey];
                }
            })
            return returnedJSON;
        }
    })

    .filter('isBrandInAccount', function() {
        return function(data, brandName) {

            returnedJSON = {};

            Object.keys(data).forEach(function(bigKey) {

                if (data[bigKey].brandName == brandName) {
                    returnedJSON[bigKey] = data[bigKey];
                }
            })
            return returnedJSON;
        }
    })

    // This filter is used to return the number of client instances for an account
    .filter('instancesInAccount', function() {
        return function(data, accountName) {

            var count = 0;

            Object.keys(data).forEach(function(bigKey) {

                if (data[bigKey].accountName == accountName) {
                    count++;
                }
            })
            return count;
        }
    })

    // This filter is used to return the number of client instances for a brand
    .filter('instancesInBrand', function() {
        return function(data, brandName) {

            var count = 0;

            Object.keys(data).forEach(function(bigKey) {

                if (data[bigKey].brandName == brandName) {
                    count++;
                }
            })
            return count;
        }
    })

    .directive('clientListDiv', ['$timeout', function($timeout) {
        return {
            link: function($scope, element, attrs) {
                $scope.$on('dataloaded', function() {
                    $timeout(function() {

                        var substringMatcher = function(strs) {
                            return function findMatches(q, cb) {
                              var matches, substringRegex;
                          
                              // an array that will be populated with substring matches
                              matches = [];
                          
                              // regex used to determine if a string contains the substring `q`
                              substrRegex = new RegExp(q, 'i');
                          
                              // iterate through the pool of strings and for any string that
                              // contains the substring `q`, add it to the `matches` array
                              $.each(strs, function(i, str) {
                                if (substrRegex.test(str)) {
                                  matches.push( {value: str});
                                }
                              });

                              cb(matches);
                            };
                          };

                        var clients = $('#ClientCtrl').scope().clientList.data;
                    
                        clientListForTypeAhead = [];
                        s = {};

                        $.each(clients, function(i, client) {
                            s[client.name] = client;
                            clientListForTypeAhead.push(client.name);
                        });
                          
                        $('.bloodhound .typeahead').typeahead({
                            hint: true,
                            highlight: true,
                            minLength: 1
                          },
                          {
                            name: 'clients',
                            displayKey: 'value',
                            source: substringMatcher(clientListForTypeAhead)
                          });
                    });
                    }, 0, false);
                }
            }
    }]);   