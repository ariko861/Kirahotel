(function(){

	var app = angular.module('rooms', ['ngHtmlCompile', 'kira_tools']);
	
	app.controller('RoomsController', [ '$scope', '$http', '$timeout', function($scope, $http, $timeout){
		
		//initialization of variables
		$scope.list_rooms = [];
		$scope.list_currencies = [];
		$scope.list_rates = [];
		$scope.default_prices = [];
		$scope.showRatesForm = false;
		$scope.newRates = {};
		$scope.newRates.prices = [];
		$scope.newRatesForRoom = [];
		$scope.rateToDelete = "";
		$scope.roomName = [];
		$scope.roomNameHTML = "<h3>{{room.room_name}}</h3>";
		$scope.pricesFormHTML = '<span class="price">{{room.default_price | number:2}}</span>';
		$scope.showAddRoomForm = false;
		$scope.newRoom = {};
		
				//function to cancel display of confirmation popup
		$scope.cancelSuperPopup = function(){
			$scope.popupAction = '';
			$scope.show_super_popup = false;
			$scope.superpopup_message="";
		}
				
		$scope.$watch('changes_allowed', function(newValue, oldValue){
			if ( newValue === true ){
				$scope.roomNameHTML = "<input class='form-control' ng-model='room.room_name'/><button class='btn btn-default' ng-click='changeRoomName(room)'>Save changes</button>";
				$scope.pricesFormHTML = '<input class="form-control priceinput" ng-model="room.default_price" type="number" min="0" step="any" required />';
			} else if ( newValue === false ){
				$scope.roomNameHTML = "<h3>{{room.room_name}}</h3>";
				$scope.pricesFormHTML = '<span class="price">{{room.default_price | number:2}}</span>';
			}
		});
		
		// function to end loading and show result as notification
		$scope.notif_statut = "";
		$scope.load = function(){
			$scope.notif_statut = "loading";
		}
		$scope.validateAction = function(msg, statut){
			$scope.notif_statut = "validated";
			$scope.successmessage = msg;
			$scope.statutmessage = statut;
			$timeout(function(){
				$scope.notif_statut = "";
			}, 2000);
		}
		
		// get default_currency
		$scope.default_currency = {};
		$http.get('/config/defaultCurrency').success(function(data){
			$scope.default_currency = data;
		}).error(function(err){
			console.error(err);
		});
		
		//list currencies set as active
		$http.get('/config/listActiveCurrencies').success(function(data){
			$scope.list_currencies = data;			
		}).error(function(error){
			console.error(error);
		});
		
		// list rates
		$scope.updateRates = function(){
			$http.get('/rates/list').success(function(data){
				$scope.list_rates = data;			
			}).error(function(error){
				console.error(error);
			});
		}
		
		$scope.updateRooms = function(){
			$http.get('/rooms/list').success(function(data){
				$scope.list_rooms = data;
				
			}).error(function(error){
				console.error(error);
			});
		}
		
		$scope.updatePrice = function(room){
			$http.post('/rooms/updatePrice', {id : room._id, price : room.default_price}).success(function(){
				alert("prices have been updated !");
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		
		$scope.showSubmitRate = function(){
			$scope.newRates = {};
			$scope.showRatesForm = true;
		}
		
		$scope.cancelRateForm = function(){
			$scope.showRatesForm = false;
		}
		
		// function called when new Rate form submitted
		$scope.addRates = function(){
			
			$http.post('/rates/add', {newRate : $scope.newRates }).success(function(data){
				alert("New Rate has been added !");
				$scope.newRates = {};
				$scope.list_rates.push(data);
				$scope.showRatesForm = false;
			}).error(function(err){
				console.error(err);
			});
			
			
		}
		
		// add a rate to a room
		$scope.addRatesToRoom = function(id){
			$scope.load();
			$http.post('/rooms/addRate', {id : id, new_rate: $scope.newRatesForRoom[id]}).success(function(data){
				$scope.updateRooms();
				$scope.validateAction(data, 'success');
				
			}).error(function(err){
				$scope.validateAction(data, 'error');
			});
		}
		
		//delete a rate
		$scope.deleteIDRates = function() {
			$scope.load();
			$http.post('/rates/delete', {id : $scope.rateToDelete }).success(function(data){
				$scope.updateRooms();
				$scope.updateRates();
				$scope.validateAction(data, 'success');
			}).error(function(err){
				console.error(err);
				$scope.validateAction(err, 'error');
			});
			
		}
		
		//change name of room
		$scope.changeRoomName = function(room) {
			$scope.load();
			$http.post('/rooms/changename', {id : room._id, name: room.room_name }).success(function(data){
				$scope.validateAction(data, 'success');				
			}).error(function(err){
				console.error(err);
				$scope.validateAction(err, 'error');
			});
		}
		/*
		//function to check if a price currency is managed
		$scope.checkCurrency = function(price){
			var index = findIndexByKeyValue($scope.list_currencies, 'code', price.currency_code);
			if ($scope.list_currencies[index] == null) return false;
			else return true;
			//if ($scope.list_currencies[index].active) return true;
			//else return false;
			
		}*/
		
		//function to show form to add room
		$scope.launchAddRoomForm = function(){
			$scope.showAddRoomForm = true;
		}
		
		//function to cancel the new room form
		$scope.cancelAddRoomForm = function(){
			$scope.showAddRoomForm = false;
			$scope.newRoom = {}; 
		}
		
		//function to add room
		$scope.addRoom = function(){
			$scope.loading = true;
			$http.post('/rooms/add', {room: $scope.newRoom}).success(function(data){
				$scope.validateAction(data, 'success');
				$scope.newRoom = {};
				$scope.showAddRoomForm = false;
				$scope.updateRooms();
			}).error(function(err){
				$scope.validateAction(err, 'error');
			});
		}
		
		$scope.forceRoomFree = function(room){
			$scope.roomToFree = room;
			$scope.popupAction = '<button ng-click="setRoomFree()">Confirm</button>';
			$scope.show_super_popup = true;
			$scope.superpopup_message="Are you sure you want to set this room free ? Thie might lead to bugs and mistake if there are clients inside this room";
		}
		
		$scope.setRoomFree = function(){
			$scope.load();
			$http.post('/rooms/force_free_room', { room_id: $scope.roomToFree._id})
			.success(function(data){
				$scope.validateAction(data, 'success');
				$scope.cancelSuperPopup();
				$scope.roomToFree.occupied = false;
			}).error(function(err){
				$scope.validateAction(err, 'error');
				console.error(err);
			});
		}
		
		//update list_rooms while on page load
		$scope.updateRooms();
		
	}]);


	app.directive('roomsNameController', ['$compile', function($compile){
		
		function link(scope, element, attrs){
			
			
		}
		var template = "<h3>{{room.room_name}}</h3>";
	           
		return {
			restrict: 'E',
			
			link: function(scope, element){
			
				element.on("dblclick", function(){
					template="<input ng-model='roomName[room._id]' ng-init='roomName[room._id] = room.room_name' /><button ng-click='changeRoomName(room._id)'>Save changes</button>";
					scope.$apply(function() {
	                    var content = $compile(template)(scope);
	                    element.replaceWith(content);
					})
				});
				
				
				var linkfn = $compile(template);
				var content = linkfn(scope);
				element.append(content);
			},
			
		}
		
		
	}]);

	app.directive('datepicker', function() {
	    return {
	        restrict: 'A',
	        require : 'ngModel',
	        link : function (scope, element, attrs, ngModelCtrl) {
	            $(function(){
	                element.datepicker({
						dateFormat: "yy-mm-dd",
						changeMonth: true,
						changeYear: true,
						showOtherMonths: true,
						selectOtherMonths: true,
						function (date) {
							scope.$apply(function () {
	                            ngModelCtrl.$setViewValue(date);
	                        });
	               
	                    }
	                });
	            });
	        }
	    }
	});


})();
