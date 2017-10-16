angular.module('clientService', [])

	.factory('Clients', function($http) {
		return {
			get 		  	 : function() {
				return $http.get('/api/clients');
			},
			getClientList	 : function() {
				return $http.get('/api/clientList');
			},
			getBrands		 : function(accountName, callType) {
				return $http({
					url   : '/api/clients/' + accountName,
					method: "GET",
					params: { callType: callType }
				});
			},
			getProducts : function(clientName) {
				return $http({
					url   : '/api/products',
					method: "GET",
					params: { clientName: clientName}
				});
			},
			getProductCountForInstance	 : function(clientName) {
				return $http({
					url   : '/api/search/' + clientName,
					method: "GET",
					params: { }
				});
			},
			create 		  	 : function(data) {
				return $http.post('/api/clients', data);
			},
			createAccount 	 : function(clientData) {
				return $http.post('/api/clients', clientData);
			},
			createClient   	 : function(clientData) {
				return $http.post('/api/clients', clientData);
			},
			update 		  	 : function(dbDocument, clientData) {
				return $http.put('/api/clients/' + dbDocument._id, { dbDocument, clientData });
			},
			updateOLD	  	 : function(id, clientData) {
				return $http.post('/api/clients/' + id, clientData);
			},
			delete  	  	 : function(dbDocument) {
				return $http.delete('/api/clients/' + dbDocument._id, { params: dbDocument });
			},
			displayCodes  	 : function(clientData) {
				return $http.post('/api/clients/' + clientData._id + '/displayCodes', clientData);
			}
		};
	});