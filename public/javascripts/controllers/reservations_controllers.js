(function(){

	var app = angular.module('reservations', ['ngHtmlCompile', 'kira_tools', 'i18n']);
	
	
	app.controller('ReservationsController', [ '$scope', '$http', '$timeout', 'i18n', function($scope, $http, $timeout, i18n){
		
		//////// get translations
		$scope.i18n = i18n;
		$scope.trans = {};
		$scope.trans.prices_calculated = i18n.__('prices have been calculated');		
		$scope.trans.choose_correct_dates = i18n.__('You must choose correct dates !');
		$scope.trans.rooms_are_available = i18n.__('rooms are available');
	
		i18n.ensureLocaleIsLoaded().then( function() {
			$scope.trans.prices_calculated = i18n.__('prices have been calculated');		
			$scope.trans.choose_correct_dates = i18n.__('You must choose correct dates !');
			$scope.trans.rooms_are_available = i18n.__('rooms are available');
				
		});
	
		
		
		// initialization of variables
		$scope.list_reservations = [];
		$scope.list_currencies = [];
		$scope.edge = "begin";
		$scope.datesToCheck = {};
		$scope.loading = false;
		$scope.validated = false;
		$scope.successmessage = "";
		$scope.statutmessage = '';
		$scope.minDatePicker = "";
		$scope.lastReservation = null;
		$scope.nextReservation = null;
		$scope.roomsAvailable = [];
		$scope.showRoomsAvailable = false;
		$scope.newReservation = {};
		$scope.showFormAddRes = false;
		
		
		// function to end loading and show result as notification
		$scope.validateAction = function(msg, statut){
			$scope.loading = false;
			$scope.successmessage = msg;
			$scope.statutmessage = statut;
			$scope.validated = true;
			$timeout(function(){
				$scope.validated = false;
			}, 2000);
		}
		
		//list languages set as active
		$scope.list_languages = [];
		
		$http.get('/config/listActiveLanguages').success(function(data){
			$scope.list_languages = data;			
		}).error(function(error){
			console.error(error);
		});
		

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
		
		//function to manage order in the reservation table
		$scope.predicate = 'begin';
		$scope.reverse = true;
		$scope.order = function(predicate) {
			$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
			$scope.predicate = predicate;
		};
		
		$scope.displayDate = function(date){
			dati = new Date(date)
			var disdate = {
				month : months_list[dati.getMonth()],
				year: 1900 + dati.getYear(),
				dayinw: days_list[dati.getDay()].slice(0,3),
				dayinm: dati.getDate()
			}
			
			return disdate.dayinw + " " + disdate.dayinm + " " + disdate.month + " " + disdate.year
			
		}
		
		//function that get the list of all reservations
		$scope.updateReservations = function(){
			$http.get('/reservations/list').success(function(data){
				$scope.list_reservations = data;
			}).error(function(error){
				console.log(error);
			});
		}
		
		//function that switch filter of reservations between beginning or end
		$scope.filterEdge = function(edge){
			$scope.edge = edge;
			
		}
		
		// function to filter reservations between today and n days
		
		$scope.filterDates = function(n) {
			var today = new Date();
			var today_beg = new Date( today.setHours(0,0,0,0) );
			$scope.dateFrom = new Date(today_beg);
			var day_end = new Date( today_beg.setDate( today_beg.getDate() + n ) );
			var last_day_end = new Date( day_end.setHours(23,59,59,999) );
			$scope.dateTo = new Date(last_day_end);
			
		}
		$scope.filterDates(0);
		
		$scope.filtered = true;
		$scope.toggleFilter = function(){
			console.log($scope.filtered);
			$scope.filtered = ( $scope.filtered == false );
		}
		
		//function to check rooms availability
		$scope.checkAvailability = function(){
			$scope.loading = true;
			if ($scope.datesToCheck.begin <= $scope.datesToCheck.end){ 
				$http.post('/reservations/checkavailable', {datesToCheck : $scope.datesToCheck}).success(function(data){
					$scope.roomsAvailable = data;
					$scope.showRoomsAvailable = true;
					$scope.validateAction(data.length + ' '+ $scope.trans.rooms_are_available,'success');
				}).error(function(err){
					console.error(err);
					$scope.validateAction(err, 'error');
				});
				
			} else {
				$scope.validateAction( $scope.trans.choose_correct_dates, 'error')
			}
		}
		
		//function to launch reservation form
		$scope.launchReservationForm = function(room, dateBegin, dateEnd){
			$scope.loading = true;
			$scope.newReservation.room = room;
			$scope.newReservation.begin = dateBegin;
			$scope.newReservation.end = dateEnd;
			$scope.cancelListAvailable();
			
			if (dateBegin <= dateEnd){ 
				$http.post('/reservations/checkprice', {room_id : room._id, dateBegin : dateBegin, dateEnd: dateEnd}).success(function(data){
					$scope.newReservation.price = data.total;
					$scope.newReservation.newrates = data.rates;
									
					$scope.showFormAddRes = true;
					$scope.validateAction( $scope.trans.prices_calculated,'success');
				}).error(function(err){
					console.error(err);
					$scope.validateAction(err, 'error');
				});
				$http.post('/reservations/checkOtherReservations', {room_id: room._id, date : dateBegin}).success(function(data){
					if (data.min != null) data.min = new Date(data.min);
					if (data.max != null) data.max = new Date(data.max);
					$( ".datepickerRes" ).datepicker( "option", "minDate", data.min );
					$( ".datepickerRes" ).datepicker( "option", "maxDate", data.max );
					var minimalEnd = addDays( dateBegin, 1 );
					$(".datepicker2").datepicker( "option", "minDate", minimalEnd );
					
				}).error(function(err){
					
				});
			} else {
				$scope.validateAction( $scope.trans.choose_correct_dates, 'error')
			}
		}
		
		
		$scope.checkPriceForPeriod = function(){
			$scope.loading = true;
			var room = $scope.newReservation.room._id;
			var begin = $scope.newReservation.begin;
			var end = $scope.newReservation.end;
			if (begin <= end){ 
				$http.post('/reservations/checkprice', {room_id : room, dateBegin : begin, dateEnd: end }).success(function(data){
					$scope.newReservation.price = data.total;
					$scope.newReservation.newrates = data.rates;
					$scope.validateAction( $scope.trans.prices_calculated,'success');
				}).error(function(err){
					console.error(err);
					$scope.validateAction(err, 'error');
				});
			} else {
				$scope.validateAction( $scope.trans.choose_correct_dates, 'error');
			}
		}
		
		
		//function cancel display of available rooms 
		$scope.cancelListAvailable = function(){
			$scope.showRoomsAvailable = false;
			$scope.datesToCheck = {};
			
		}	
		//function cancel display of new reservation form 
		$scope.cancelAddReservation = function(){
			$scope.showFormAddRes = false;
			$scope.newReservation = {};
			$scope.clientQueryResult = "";
			
		}		
		
		
		
		//function to create new reservation
		$scope.submitReservation = function(){
			begin = $scope.newReservation.begin;
			end = $scope.newReservation.end;
			$scope.loading = true;
			$http.post('/reservations/add', {newReservation: $scope.newReservation, begin_date: begin, end_date: end}).
				success(function(data){
					$scope.validateAction(data, 'success');
					$scope.updateReservations()
					$scope.cancelAddReservation();
				}).
				error(function(error){
					$scope.validateAction(error, 'error');
					console.error(error);
					
				});
		}
		
		
		//function to delete reservation
		$scope.deleteReservation = function(id){
			$http.post('/reservations/delete', {reservation_id : id}).success(function(data){
				$scope.updateReservations();
				alert(data);
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		// function called when user is modifiying a client field, to look for the list of clients
		$scope.clientQueryResult = "";
		$scope.fetchClientSearch = function(query){
			if (query && query.length >= 3){
				$http.post('/clients/fetch', { query : query }).success(function(result){
					$scope.clientQueryResult = '';
					for ( i=0 ; i<result.length ; i++){
						client_name = result[i].first_name +" "+ result[i].last_name
						$scope.clientQueryResult += "<li class='input_query_result' ng-click='selectClient(" +'"'+ result[i]._id +'"'+"," +'"'+ client_name +'"'+ ")'>" + client_name + "</li>";
					}
				}).error(function(err){
					console.error(err);
				});
			} else {
				$scope.clientQueryResult = "";
			}
		}
		//function called when user click on a client fetched on an search field
		$scope.selectClient = function(id, client_name){
			$scope.newReservation.client_name = client_name;
			$scope.newReservation.client = id;
			$scope.clientQueryResult = "";
		}
		
		//////////// MODIF RESERVATION /////////////////
		
		$scope.resToMod = {};
		
		$scope.editReservation = function(reservation){
			$scope.resToMod = angular.copy(reservation);
			$scope.modResBegin = new Date( $scope.resToMod.begin );
			$scope.modResEnd = new Date( $scope.resToMod.end );
			$scope.roomResModInit = angular.copy(reservation.room);
			if ($scope.modResBegin <= $scope.modResEnd){ 
				$http.post('/reservations/checkprice', {room_id : $scope.resToMod.room._id, dateBegin : $scope.modResBegin, dateEnd: $scope.modResEnd}).success(function(data){
					$scope.resToMod.price = data.total;
					$scope.resToMod.newrates = data.rates;
					$scope.showModRes = true;
					$scope.validateAction( $scope.trans.prices_calculated,'success');
				}).error(function(err){
					console.error(err);
					$scope.validateAction(err, 'error');
				});
				$http.post('/reservations/checkOtherReservations', {room_id: $scope.resToMod.room._id, date : $scope.modResBegin}).success(function(data){
					if (data.min != null) data.min = new Date(data.min);
					if (data.max != null) data.max = new Date(data.max);
					$( ".datepickerRes" ).datepicker( "option", "minDate", data.min );
					$( ".datepickerRes" ).datepicker( "option", "maxDate", data.max );
					var minimalEnd = addDays( $scope.modResBegin, 1 );
					$(".datepicker2").datepicker( "option", "minDate", minimalEnd );
					
				}).error(function(err){
					
				});
			} else {
				$scope.validateAction( $scope.trans.choose_correct_dates, 'error')
			}
			
		}
		
		$scope.cancelModReservation = function(){
			$scope.resToMod = {};
			$scope.showModRes = false;
		}
		
		$scope.checkModPriceForPeriod = function(){
			$scope.loading = true;
			var room = $scope.resToMod.room._id;
			var begin = $scope.modResBegin;
			var end = $scope.modResEnd;
			if (begin <= end){ 
				$http.post('/reservations/checkprice', {room_id : room, dateBegin : begin, dateEnd: end }).success(function(data){
					$scope.resToMod.price = data.total;
					$scope.resToMod.newrates = data.rates;
					$scope.validateAction( $scope.trans.prices_calculated,'success');
				}).error(function(err){
					console.error(err);
					$scope.validateAction(err, 'error');
				});
			} else {
				$scope.validateAction( $scope.trans.choose_correct_dates, 'error');
			}
		}
		
		// function trigger when change form submit
		$scope.modifReservation = function(){
			$http.post('/reservations/change', { resmodif: $scope.resToMod, begin_date: $scope.modResBegin, end_date: $scope.modResEnd})
				.success(function(data){
					$scope.validateAction(data, 'success');
					$scope.updateReservations();
					$scope.cancelModReservation();
				})
				.error(function(error){
					$scope.validateAction(error, 'error');
					console.error(error);
					
				});
			
		}
		$scope.rooms_available = [];
		
		$scope.changeRoom = function(){
	
			$scope.show_change_room = true;
			$scope.loading = true;
			var datesToCheck = {
				begin: $scope.modResBegin,
				end: $scope.modResEnd,
			}
			if ($scope.modResBegin <= $scope.modResEnd){ 
				$http.post('/reservations/checkavailable', {datesToCheck : datesToCheck}).success(function(data){
					$scope.rooms_available = data;
					
					$scope.validateAction(data.length + ' ' + $scope.trans.rooms_are_available,'success');
				}).error(function(err){
					console.error(err);
					$scope.validateAction(err, 'error');
				});
				
			} else {
				$scope.validateAction( $scope.trans.choose_correct_dates, 'error')
			}
		}
		
		$scope.confirmChangeRoom = function(room){
			$scope.resToMod.room = angular.copy(room);
			$scope.show_change_room = false;
			$scope.rooms_available = [];
		}
		
		$scope.cancelChangeRoom = function(){
			$scope.resToMod.room = angular.copy($scope.roomResModInit);
			$scope.show_change_room = false;
			$scope.rooms_available = [];
		}
		
		//////////// END MODIF RESERVATION /////////////////
		
				/////////// ADD CLIENT ////////////////
		
		//function called when the link "add new client" is clicked, show the client form
		$scope.showCliForm = function(bool){
			$scope.newclient = {};
			$scope.divform = bool;
		}
		
		//function called to cancel display of client form and reinitialize the fields
		$scope.cancelCliForm = function(){
			$scope.newclient = {};
			$scope.showCliForm(false);
		}
		
		//function to add client
		$scope.addClient = function() {
			$http.post('/clients/add', {newclient : $scope.newclient}).success(function(data){
				$scope.cancelCliForm();
			}).error(function(err){
				console.error(err);
			});
		};
		
		/////////// END ADD CLIENT ////////////////
		
		//on load, update list of reservations
		$scope.updateReservations()
		
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
	
	app.filter("resfilter", function() {
		return function(items, edge, from, to, filtered) {
		        var df = new Date(from);
		        var dt = new Date(to);
		        var result = [];        
		        for (var i=0; i<items.length; i++){
					if ( filtered == false ){
						result.push(items[i]);
					} else {
						if (edge == "begin"){
							var tt = new Date(items[i].begin);
			            } else if (edge == "end"){
							var tt = new Date(items[i].end);
						}
			            if (tt >= df && tt <= dt)  {
			                result.push(items[i]);
			            }
					}
		        }            
		        return result;
		  };
	});


var getindexindict = function(dict, val){
	for (i=0;i<dict.length;i++){
		if (dict[i]._id == val){
			return i;
		}
	}
}

})();
