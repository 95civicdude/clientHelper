angular.module('appClientController', [])

	// inject the Client service factory into our controller
	.controller('ClientCtrl', function($scope, $http, $filter, $window, Clients, Audits) {
		$scope.formData = {};

        var docDecl = { content: "This is the content" };

        $scope.openPdf = function() {
            pdfMake.createPdf(docDecl).open();
        };

		// GET =====================================================================
        // when landing on the page, get all clients and show them
        // use the service to get all the clients
		Clients.get()
            .success(function(data) {
                $scope.dbDocuments = data;

				$scope.showDiv('../../templates/testingPanel.html');
            });

        Audits.get()
            .then(function(audits) {
                $scope.auditDocs = audits;
            });

        $scope.createRecord = function(dbDocument = {}, panelToShow) {

            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same client anymore
            if (!$.isEmptyObject($scope.formData)) {

                $scope.formData.callType = 'record';

                if ($.isEmptyObject(dbDocument[0])) {
                    // call the create function from our service (returns a promise object)
                    Clients.create($scope.formData)

                        // if successful creation, call our get function to get all the new clients
                        .success(function(data) {
                            $scope.formData = {};   // clear the form so our user is ready to enter another
                            $scope.dbDocuments = data; // assign our new list of clients
                        });
                } else {
                    console.log(dbDocument[0].accountName);
                    $scope.formData.accountName = dbDocument[0].accountName;
                    $scope.formData.accountDirector = dbDocument[0].accountDirector;

                    // call the create function from our service (returns a promise object)
                    Clients.create($scope.formData)

                        // if successful creation, call our get function to get all the new clients
                        .success(function(data) {
                            $scope.formData = {};   // clear the form so our user is ready to enter another
                            $scope.dbDocuments = data; // assign our new list of clients
                            $scope.currentAccount = data[0].accountName;

                            $scope.showDiv('../../templates/' + panelToShow + '.html');
                        });
                }
            }
        };

        // ADD TEAM MEMBER =========================================================
        // Adding an account team member to the Account.
        // Involves updating all dbDocuments within the Account
        $scope.addTeamMember = function(dbDocument = {}, callType) {

            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same client anymore
            if (!$.isEmptyObject($scope.formData)) {

                if (callType === 'accountTeamMember') {

                    $scope.formData.callType = 'accountTeamMember';

                    if ($.isEmptyObject(dbDocument)) {

                        throw new Error('Oh no, you\'ve tried to edit a non-existent account');
                    } else {

                        // call the create function from our service (returns a promise object)
                        Clients.update(dbDocument, $scope.formData)

                            // if successful creation, call our get function to get all the new clients
                            .success(function(data) {
                                $scope.formData = {};   // clear the form so our user is ready to enter another
                                $scope.dbDocuments = data; // assign our new list of clients
                            });
                    }   
                } else if (callType === 'techTeamMember') {
                        
                    $scope.formData.callType = 'techTeamMember';

                    if ($.isEmptyObject(dbDocument)) {

                        throw new Error('Oh no, you\'ve tried to edit a non-existent account');
                    } else {

                        // call the create function from our service (returns a promise object)
                        Clients.update(dbDocument, $scope.formData)

                            // if successful creation, call our get function to get all the new clients
                            .success(function(data) {
                                $scope.formData = {};   // clear the form so our user is ready to enter another
                                $scope.dbDocuments = data; // assign our new list of clients
                            });
                    }   
                }
            }
        }

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
                        $scope.brands   = data; // assign our new list of clients
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
        		Clients.updateOLD(id, $scope.formData)

        			.success(function(data) {
        				$scope.formData = {};	// clear the form so our user is ready to enter more updates
        				$scope.clients = data;	// assign our new client data
        			});	
        	}
        };

        // CREATE TECH PLAN ========================================================
        // For creating a tech plan
        $scope.createTechPlan = function(dbDocument) {

            // go to the accountPlanPanel.html page, passing in the name of the account
            //$scope.accountName = accountName;
            var accountName = dbDocument.accountName;
            var returnedJSON = [];
            var instanceCtr = 0;
            $scope.techPlanData = {
                "numOfInstances" : 0,
                "products"       : [ String ],
                "numOfLocales"   : 0,
                "platform"       : String,
                "edr"            : false,
                "pixel"          : false,
                "analytics"      : String
            };

            Object.keys($scope.dbDocuments).forEach(function(bigKey) {

                if ($scope.dbDocuments[bigKey].accountName == accountName) {
                    returnedJSON[bigKey] = $scope.dbDocuments[bigKey];
                    instanceCtr++;
                }
            })

            $scope.techPlanData["numOfInstances"] = instanceCtr;

            returnedJSON = [];
            instanceCtr = 0;

            $scope.dbDocument = this.dbDocument;
            $scope.showDiv("../../templates/accountPlanPanel.html");            
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


		// DELETE ==================================================================
        // delete a client after checking it
        $scope.deleteClient = function(id) {
            Clients.deleteOLD(id)

                // if successful creation, call our get function to get all the new clients
                .success(function(data) {
                    $scope.clients = data;		// assign our new list of clients
                });
        };

        // Returned 'data' field is a JSON Object. We need to drill down to data.data to get
        // the actual data portion (dbDocuments) that the application is expecting. It's easier to
        // add that step here, just in case we ever need the other items returned in 'data'
        // (which the most important one I can think of would be the 'config' JSON object)
        $scope.doStuff = function(accountName, pageToLoad, callType) {

            Clients.getBrands(accountName, callType)
            .then(function(data) {
                console.log(data);
                $scope.dbDocuments = data.data;
                $scope.currentAccount = data.data[0].accountName;

                $scope.showDiv('../../templates/' + pageToLoad + '.html');
            })
        };

        // AUDIT STUFF =============================================================
        $scope.openAuditPage = function(accountName, pageToLoad) {

            $scope.currentAccount = accountName;
            $scope.showDiv('../../templates/' + pageToLoad + '.html');
        };

        $scope.auditFormAccountChange = function(accountName) {
            console.log("Account name " + accountName);
            $scope.auditAccountName = accountName;
        };
        // $scope.$watch('auditData.accountName', function(newVal, oldVal){
        //     console.log('new value ' + newVal);
        //     $scope.auditAccountName = newVal;
        // });
        // END AUDIT STUFF =========================================================

        $scope.getProductCount = function(clientName) {
            console.log(clientName);
            // Clients.getProducts(clientName)
            // .then(function(data) {
            //     console.log(data);
            //     $scope.activeProductCount = data.data.statistics.activeProductCount;
            // });
        };

        // EXPAND CLIENT ===========================================================
        // shows all clients within the specified bundle
        $scope.expand = function(id, data, panelToShow, callType) {

            if ($.isEmptyObject(data)) {
                data = {};
            }
            if ($.isEmptyObject(callType)) {
                callType = "noType";
            }


            var clientData = {
                data       : data,
                callType   : callType,
                parentId   : $scope.parentId
            };

        	Clients.expand(id, clientData)

        		.success(function(data) {
        			$scope.parentId = id;

                    if (callType === 'account') {
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

        // THIS GOES in appPanel.htm when clicking the brand name
        // ng-click="monitorDeployments(dbDoc.clientName)"
        $scope.monitorDeployments = function(clientName) {

            Clients.getClientMonitor(clientName)

                .success(function(data) {
                    $scope.clientMonitor = data;
                });
        };

        $scope.returnClient = function(panelToShow) {
        	
        	Clients.get()

        		.success(function(data) {
        			$scope.clients = data;
        			$scope.showDiv(panelToShow);
        		});
        };

        $scope.saveTechPlan = function(dbDocument = {}) {

            if (!$.isEmptyObject($scope.formData)) {

                if ($.isEmptyObject(dbDocument)) {

                    throw new Error('Oh no, you\'ve tried to edit a non-existent account');
                } else {

                    $scope.formData.numOfInstances = $scope.techPlanData.numOfInstances;
                    $scope.formData.numOfLocales   = $scope.techPlanData.numOfLocales;
                    // call the create function from our service (returns a promise object)
                    Clients.createTechPlan(dbDocument, $scope.formData)

                        // if successful creation, call our get function to get all the new clients
                        .success(function(data) {
                            $scope.formData = {};   // clear the form so our user is ready to enter another
                            $scope.dbDocuments = data; // assign our new list of clients
                            $scope.showDiv("../../templates/appPanel.html");                               
                        });
                }               
            }
        };

        $scope.cancelTechPlan = function() {

            $scope.techPlanData = {};
            $scope.showDiv('../../templates/appPanel.html');
        };

        $scope.showDiv = function(nameOfTemplate) {
        	$scope.templateUrl = nameOfTemplate;
        };

        $scope.getDatetime = function() {
            return (new Date).toLocaleDateString();
        };

        // $scope.getProductCountForInstance = function(clientName) {
        //     Clients.getProductCountForInstance(clientName)
        //         .success(function(data) {
        //             $scope.activeProductCount = data.count;
        //     });
        // };
    })

    // trying to get to where I can run getProductCount from the AuditPanel page
    // .directive('productDirective', function() {
    //     return {
    //         restrict: "A",
    //         template: '<div>{{ clientName }}</div>',
    //         scope: {
    //             client: '='
    //         },
    //         link: function(scope, element, attrs) {
    //             console.log(scope);
    //             getProductCountForInstance(scope.client.clientName);
    //         }
    //     };
    // })

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