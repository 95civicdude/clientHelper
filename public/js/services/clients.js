angular.module('clientService', [])

	.factory('Clients', function($http) {
		return {
			get 		  : function() {
				return $http.get('/api/clients');
			},
			createAccount : function(clientData) {
				return $http.post('/api/clients', clientData);
			},
			createClient  : function(clientData) {
				return $http.post('/api/clients', clientData);
			},
			update 		  : function(id, clientData) {
				return $http.post('/api/clients/' + id, clientData);
			},
			delete 		  : function(id) {
				return $http.delete('/api/clients/' + id);
			},
			expandClient  : function(id) {
				return $http.get('/api/clients/' + id);
			}
		}
	});