(function(){

	var cli = angular.module('clients', ['settings', 'ngHtmlCompile']);
	
	cli.service('configuration', function(settings) {
		this.USER = settings.USER;
	});


	cli.controller('ClientsController', [ '$scope', '$http', 'configuration', function($scope, $http, configuration){
		
		$scope.session = {};
		$scope.list_clients = [ ];
		$scope.deletion_allowed = false;
		//variable that show the client form when true
		$scope.divform = false;
		$scope.query = '';
		$scope.client_query = '';
		
		//list languages set as active
		$scope.list_languages = [];
		
		$http.get('/config/listActiveLanguages').success(function(data){
			$scope.list_languages = data;			
		}).error(function(error){
			console.error(error);
		});
		
		//function called when the link "add new client" is clicked, show the client form
		$scope.showCliForm = function(){
			$scope.divform = true;
		}
		
		//function called when client edit clicked
		$scope.editClient = function(client){
			$scope.selected_client = client;
			$scope.newclient = angular.copy(client);
			$scope.form_action = 'modif';
			$scope.divform = true;
		}
		
		$scope.infoClient = function(client){
			$scope.newclient = angular.copy(client);
			$scope.form_action = 'info';
			$scope.divform = true;
		}
		
		//function called to cancel display of client form and reinitialize the fields
		$scope.cancelCliForm = function(){
			$scope.newclient = {};
			$scope.divform = false;
			$scope.form_action = '';
		}
		
		//function to check if deletion allowed
		$scope.canDelete = function(bool){
			return $scope.deletion_allowed === bool;
		}
		//function to set deletion permit
		$scope.setAllowDelete = function(bool){
			$scope.deletion_allowed = bool;
		}
		
		//function to get all clients list
		$scope.updateClients = function(){
			$http.get('/clients/list').success(function(data){
				$scope.list_clients = data;
			}).error(function(error){
				console.log(error);
			});
		}
		
		$scope.newclient = {};
		
		//function to add or update client
		$scope.addClient = function() {			
			if ( $scope.form_action == 'info' ) return null;
			else if ( $scope.form_action == 'modif' ){
				
				$http.post('/clients/update_client', {client : $scope.newclient}).success(function(data){
					$scope.updateClients();
					$scope.cancelCliForm();
				}).error(function(err){
					console.error(err);
				});
				
			} else {
				
				$http.post('/clients/add', {newclient : $scope.newclient}).success(function(data){
					$scope.list_clients.push(data);
					$scope.cancelCliForm();
				}).error(function(err){
					console.error(err);
				});
			}
		};
		
		//function to delete client
		$scope.deleteClient = function(id){
			$http.post('/clients/delete', {id : id}).success(function(data){
				$scope.updateClients();
				alert(data);
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		$scope.predicate = 'last_name';
		$scope.reverse = true;
		$scope.order = function(predicate) {
			$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
			$scope.predicate = predicate;
		};
		
		//get user session
		configuration.USER.success(function(data){
			$scope.session = data;
			console.log(data);
			if ( $scope.session.rights && $scope.session.rights.has_access_client_list ){
				// if user has rights, display the list of all clients
				$scope.updateClients();
				$scope.searchHtml = "<input id='clientRequest1' class='form-control' type='text' ng-model='query'/>";
			} else {
				// else create an input field to search on the server
				$scope.searchHtml = '<input id="clientRequest1" class="form-control" ng-model="client_query", ng-change="fetchClientSearch()", type="text"/>';
			}
			
		}).error(function(err){
			console.error(err);
		});
		
		// function to make client query to server
		$scope.fetchClientSearch = function(){
			query = $scope.client_query;
			if (query && query.length >= 3){
				$http.post('/clients/fetch', { query : query }).success(function(result){
					$scope.list_clients = result;
				}).error(function(err){
					console.error(err);
				});
			} else {
				$scope.clientQueryResult = "";
			}
		}
		
	}]);



})();
