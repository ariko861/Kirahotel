(function(){
	

	var app = angular.module('calendar', ['settings','ngHtmlCompile', 'i18n']);
	
	app.service('configuration', function(settings) {
		this.USER = settings.USER;
	});
	
	app.controller('CalendarController',['$rootScope','$scope', '$http', '$timeout', 'configuration', 'i18n', function($rootScope, $scope, $http, $timeout, configuration, i18n) {
		
		
		$scope.i18n = i18n;
		$scope.trans = {};
		$scope.trans.already_reservation = i18n.__("there is already a reservation on these dates");
		$scope.trans.prices_calculated = i18n.__('prices have been calculated');
		$scope.trans.choose_correct_dates = i18n.__('You must choose correct dates !');
		$scope.trans.confirm = i18n.__("Confirm");
		$scope.trans.cannot_delete_checkedin = i18n.__("You can't delete a reservation that is checked in !");
		$scope.trans.sure_delete_reservation = i18n.__("Are you sure you want to delete this reservation ?");
		$scope.trans.must_reservation_id = i18n.__("You must provide the reservation id to delete it");
		$scope.trans.rooms_are_available = i18n.__('rooms are available');
	
		
		
		i18n.ensureLocaleIsLoaded().then( function() {
			$scope.trans.already_reservation = i18n.__("there is already a reservation on these dates");
			$scope.trans.prices_calculated = i18n.__('prices have been calculated');
			$scope.trans.choose_correct_dates = i18n.__('You must choose correct dates !');
			$scope.trans.confirm = i18n.__("Confirm");
			$scope.trans.cannot_delete_checkedin = i18n.__("You can't delete a reservation that is checked in !");
			$scope.trans.sure_delete_reservation = i18n.__("Are you sure you want to delete this reservation ?");
			$scope.trans.must_reservation_id = i18n.__("You must provide the reservation id to delete it");
			$scope.trans.rooms_are_available = i18n.__('rooms are available');

		});
				
		$scope.loading = false;
		$scope.validated = false;
		$scope.successmessage = "";
		$scope.statutmessage = '';
		$scope.maxDateForResEnd = null;
		$scope.rights = {};
		$scope.popupAction = "";
		
		//get user session
		configuration.USER.success(function(data){
			$scope.rights = data.rights;
		}).error(function(err){
			console.error(err);
		});
		
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
		
		$scope.list_currencies = [];
		//variable that show the reservation form when true
		$scope.showFormAddRes = false;
				
		//function called when a empty day is clicked, show the reservation form
		$scope.showResForm = function(bool){
			$scope.showFormAddRes = bool;
		}
		
						
		//list currencies set as active
		$http.get('/config/listActiveCurrencies').success(function(data){
			$scope.list_currencies = data;			
		}).error(function(error){
			console.error(error);
		});
		
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
		
		$scope.rooms = [];
		var nowaday = new Date()
		now = new Date( nowaday.setHours(12,0,0,0) );
		today = now.getTime();
		$scope.today = today;
		var xday = 24*60*60*1000;
		
		$scope.delta = 8;
		
		$scope.beginCal = today ;
	    
	    $scope.updateEndCal = function(){
			$scope.endCal = $scope.beginCal + ($scope.delta) * xday;
	    }
	    
	    
		$scope.days = []; //days_list defined in template
		
		
		$scope.htmlCalendar = '';
		
		$scope.updateTable = function(beginCal, endCal){
			var headhtml="<thead>";
            var dayhtml="";
            var roomnamespan = 4;
			$scope.days = createCalendar(days_list, beginCal, endCal);
            days = $scope.days
            colspanyear = 0;
            colspanmonth = 0;
            newyear = ""
            newmonth = ""
            month = days[0].month
            year = days[0].year
            for (i=0; i<days.length; i++){
				if (days[i].time.getTime() == $scope.today){
					var classDay = "today";
				} else {
					var classDay = "";
				}
				if ( i == days.length -1 ){
					var deltaspan = 1;
				} else {
					var deltaspan = 2;
				} 
				
				if (!newmonth){
					if (days[i].month == month){
						colspanmonth += deltaspan;
						
					}else{
						newmonth = days[i].month;
						var colspannewmonth = deltaspan;
					}
				}else{
					if (days[i].month == newmonth){
						colspannewmonth += deltaspan;
					}
				}
				if (!newyear){
					if (days[i].year == year){
						colspanyear += deltaspan;
						
					}else{
						newyear = days[i].year;
						var colspannewyear = deltaspan;
					}
				}else{
					if (days[i].year == newyear){
						colspannewyear += deltaspan;
					}
				}
				
				dayhtml += "<td class='"+classDay+"' colspan="+deltaspan+"><p>"+days[i].dayinw +"</p><p>"+days[i].dayinm+"</p></td>"
				
			}
			headhtml += "<tr><th colspan="+roomnamespan+"></th><td colspan="+colspanyear+">"+year+"</td>";
			if (newyear) headhtml += "<td colspan="+colspannewyear+">"+newyear+"</td>";
			headhtml += "</tr>";
			headhtml += "<tr><th colspan="+roomnamespan+"></th><td colspan="+colspanmonth+">"+ months_list[month] +"</td>"; //months_list is defined in template
			if (newmonth) headhtml += "<td colspan="+colspannewmonth+">"+ months_list[newmonth] +"</td>"; //months_list is defined in template
			headhtml += "</tr>";
			headhtml += "<tr><th colspan="+roomnamespan+"></th>"+dayhtml+"</tr></thead>"
			
			
			ADRESS = '/calendar/getallreservations/' + beginCal + '/' + endCal
			$http.get(ADRESS).success(function(roomlist){
				$scope.htmlCalendar = headhtml + "<tbody class='calendar-body'>";
				$scope.rooms = roomlist;
				
				for (x=0;x<roomlist.length;x++){
					var html = "<tr><th colspan="+roomnamespan+">"+ roomlist[x].room_name +"</th>";
	            	var i=0;
	            	var j=0;
	            	if (roomlist[x].reservations.length == 0) {  // if there is no reservation for this room on this period
						while (i < $scope.days.length){
							if (i==0 || i == $scope.days.length) var colspan=1
				            else var colspan=2
				            
							html+="<td class='emptycell' colspan="+colspan+" ng-click='selectday("+i+", \""+ roomlist[x]._id.toString() +"\");'></td>";
			              
			                i++;
							
						}
					} else { // if there are reservations
						while (i < $scope.days.length) {
							if (j < roomlist[x].reservations.length ) {
								
								var this_day = $scope.days[i].time;
								var res_begin_raw = new Date(roomlist[x].reservations[j].begin);
								var res_begin = new Date(res_begin_raw.setHours(12,0,0,0) );
								
								
								var res_end_raw = new Date(roomlist[x].reservations[j].end);
								var res_end = new Date( res_end_raw.setHours(12,0,0,0) );
								
								if (res_begin < this_day && this_day <= res_end){ // si il y a une reservation a la date i
									//var res_length = roomlist[x].reservations[j].nights;
									var one_day = 1000*60*60*24; //Get 1 day in milliseconds
									var res_length = Math.ceil( (res_end.getTime() - this_day ) / one_day) +1;
									
									var toEndCal = $scope.days.length - i
									if ( res_length > toEndCal ){
										if (i == 0) var colspan = toEndCal*2-1;
										else var colspan = toEndCal*2;
									} else {
										if( i==0 || i==$scope.days.length ) var colspan = res_length*2 -1;
										else var colspan = res_length*2 ;
									}
									
									html +="<td class='reservation";
									html += " "+ roomlist[x].reservations[j].status + "' "
									html += "ng-click='selectReservation("+ '"' + roomlist[x].reservations[j]._id + '"' +")' colspan=" + colspan+">"+ roomlist[x].reservations[j].client_name + "<p><i>"+roomlist[x].reservations[j].nights+" nights </i></p>"+"</td>";
					                i += res_length;
					                j++
					                
								}else{
									if(i==0 || i==$scope.days.length) var colspan=1 
						            else var colspan=2				           
									html+="<td class='emptycell' colspan="+colspan+" ng-click='selectday("+i+", \""+ roomlist[x]._id.toString() +"\")'></td>";				                
									i++;
								}
								
							}
							else{
								if(i==0 || i==$scope.days.length ) var colspan=1 
						        else var colspan=2				           
								html+="<td class='emptycell' colspan="+colspan+" ng-click='selectday("+i+", \""+ roomlist[x]._id.toString()+"\")'></td>";				                
								i++;
							}
							
								
						}
					}
					html += "</tr>"
	            	$scope.htmlCalendar += html;
	            	
				}
				$scope.htmlCalendar += "</tbody>"
			}).error(function(error){
				console.log(error);
			});
			
		}
		
		$scope.updateEndCal();
		$scope.updateTable($scope.beginCal, $scope.endCal);
		
		$scope.moveCal = function(n){
			$scope.beginCal += n*24*60*60*1000;
			$scope.updateEndCal();
			$scope.updateTable($scope.beginCal, $scope.endCal);
			
		}
		
		$scope.displayDaysInCal = function(n){
			$scope.delta = n;
			$scope.updateEndCal();
			$scope.updateTable($scope.beginCal, $scope.endCal);
		}
		
		//function called when click on empty cell
		$scope.begin_selected = false;
		$scope.selectday = function(i, room_id){
			if ( $scope.rights.reservation_can_add || $scope.rights.is_superuser ){
				var begCal = new Date($scope.beginCal);
				
				if ($scope.begin_selected == false) {
					var selected_date = addDays(begCal, i-1);
					
					var index = findIndexByKeyValue($scope.rooms, '_id', room_id);
					$scope.newReservation.room = $scope.rooms[index]
					$scope.newReservation.begin = new Date(selected_date);
					$scope.newReservation.end = '';
					$scope.begin_selected = true;
					$http.post('/reservations/checkOtherReservations', {room_id: room_id, date : selected_date}).success(function(data){
						if (data.min != null) data.min = new Date(data.min);
						if (data.max != null){
							data.max = new Date(data.max);
							$scope.maxDateForResEnd = data.max;
						} else {
							$scope.maxDateForResEnd = null;
						}
						$( ".datepickerRes" ).datepicker( "option", "minDate", data.min );
						$( ".datepickerRes" ).datepicker( "option", "maxDate", data.max );
											
					}).error(function(err){
						console.error(err);
					});
				} else {
					var selected_date = addDays(begCal, i);
					
					$scope.newReservation.end = selected_date;
					$scope.begin_selected = false;
					if ($scope.maxDateForResEnd == null || selected_date <= $scope.maxDateForResEnd){
						$scope.showResForm(true);
						$scope.checkPriceForPeriod();
					} else {
						$scope.validateAction( $scope.trans.already_reservation, 'error');
					}
					
				}
			}
		
		}
		
		//function to check price for period selected
		$scope.checkPriceForPeriod = function(){
			$scope.loading = true;
			var room = $scope.newReservation.room._id;
			var begin = $scope.newReservation.begin;
			var end = $scope.newReservation.end;
			if (begin <= end){ 
				$http.post('/reservations/checkprice', {room_id : room, dateBegin : begin, dateEnd: end }).success(function(data){
					$scope.newReservation.price = data.total;
					$scope.newReservation.newrates = data.rates;
					$scope.validateAction($scope.trans.prices_calculated,'success');
				}).error(function(err){
					console.error(err);
					$scope.validateAction(err, 'error');
				});
			} else {
				$scope.validateAction($scope.trans.choose_correct_dates, 'error');
			}
		}
		
		// function to submit reservation
		$scope.newReservation = {};
		$scope.submitReservation = function(){
			if ( $scope.rights.reservation_can_add || $scope.rights.is_superuser ){
				begin = $scope.newReservation.begin;
				end = $scope.newReservation.end;
				$scope.loading = true;
				$http.post('/reservations/add', {newReservation: $scope.newReservation, begin_date: begin, end_date: end}).
					success(function(data){
						$scope.validateAction(data, 'success');
						$scope.updateTable($scope.beginCal, $scope.endCal)
						$scope.cancelAddReservation();
					}).
					error(function(error){
						$scope.validateAction(error, 'error');
						console.error(error);
						
					});
			}
		}
		
		/////////// SHOW RESERVAtION INFO //////////////////
		//function called when click on reservation
		$scope.selectReservation = function(id){
			if ( $scope.rights.reservation_can_read_info || $scope.rights.is_superuser ){
				$scope.selectedRes = {}
				$http.get('/reservations/info/' + id).success(function(data){
					$scope.selectedRes = data;
					
					$scope.showResInfo = true;
					
					
				}).error(function(err){
					console.error(err);
				});
			}
		}
		
		$scope.cancelShowResInfo = function(){
			$scope.showResInfo = false;
		}
		$scope.askDelete = function(){
			if ( $scope.selectedRes.status == "checkedin" ){
				$scope.popupAction = "";
				$scope.superpopup_message = $scope.trans.cannot_delete_checkedin;
			} else {
				$scope.popupAction = "<button class='btn btn-default' ng-click='deleteReservation(selectedRes._id)'>"+$scope.trans.confirm+"</button>";
				$scope.superpopup_message = $scope.trans.sure_delete_reservation;
			}
			$scope.show_super_popup = true;
			
		}
		
		
		$scope.cancelSuperPopup = function(){
			$scope.popupAction = '';
			$scope.show_super_popup = false;
		}
		
		
		/////////// END SHOW RESERVAtION INFO //////////////////
				
		//function to delete reservation
		$scope.deleteReservation = function(id){
			if (!$scope.rights.reservation_can_delete && !$scope.rights.is_superuser) return null;
			
			if (id == "") return console.error( $scope.trans.must_reservation_id )
			
			$http.post('/reservations/delete', {reservation_id: id }).
				success(function(data){
					$scope.cancelSuperPopup();
					$scope.cancelShowResInfo();
					$scope.selectedRes = {};
					$scope.updateTable($scope.beginCal, $scope.endCal);
				}).error(function(err){
					console.error(err);
				});
		}
		
		
		//function called to cancel display of reservation form and reinitialize the fields
		$scope.cancelAddReservation = function(){
			$scope.newReservation = {};
			$scope.clientQueryResult = "";
			$scope.showFormAddRes = false;
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
			if (!$scope.rights.client_can_add && !$scope.rights.is_superuser) return null;
			
			$http.post('/clients/add', {newclient : $scope.newclient}).success(function(data){
				$scope.cancelCliForm();
			}).error(function(err){
				console.error(err);
			});
		};
		
		/////////// END ADD CLIENT ////////////////
		
	
	
			//////////// MODIF RESERVATION /////////////////
		
		$scope.resToMod = {};
		
		$scope.editReservation = function(reservation){
			if (!$scope.rights.reservation_can_change && !$scope.rights.is_superuser) return null;
			
			$scope.resToMod = angular.copy(reservation);
			$scope.selectedRes = {};
			$scope.showResInfo = false;
			$scope.modResBegin = new Date( $scope.resToMod.begin );
			$scope.modResEnd = new Date( $scope.resToMod.end );
			$scope.roomResModInit = angular.copy(reservation.room);
			if ($scope.modResBegin <= $scope.modResEnd){ 
				$http.post('/reservations/checkprice', {room_id : $scope.resToMod.room._id, dateBegin : $scope.modResBegin, dateEnd: $scope.modResEnd}).success(function(data){
					$scope.resToMod.price = data.total;
					$scope.resToMod.newrates = data.rates;
					$scope.showModRes = true;
					$scope.validateAction($scope.trans.prices_calculated,'success');
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
				$scope.validateAction( $scope.trans.choose_correct_dates , 'error')
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
			if (!$scope.rights.reservation_can_change && !$scope.rights.is_superuser) return null;
			$http.post('/reservations/change', { resmodif: $scope.resToMod, begin_date: $scope.modResBegin, end_date: $scope.modResEnd})
				.success(function(data){
					$scope.validateAction(data, 'success');
					$scope.updateTable($scope.beginCal, $scope.endCal);
					$scope.cancelModReservation();
				})
				.error(function(error){
					$scope.validateAction(error, 'error');
					console.error(error);
					
				});
			
		}
		$scope.rooms_available = [];
		
		$scope.changeRoom = function(){
			if (!$scope.rights.reservation_can_change && !$scope.rights.is_superuser) return null;
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
				$scope.validateAction($scope.trans.choose_correct_dates, 'error')
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



function createCalendar(list_of_the_days, begin, end)
{
	displayDates = [];
	for (i = begin; i <= end; i += 24*60*60*1000){
		var dtime = new Date(i);
		var date = {
			time: dtime,
			month: dtime.getMonth(),
			year: 1900 + dtime.getYear(),
			dayinw: list_of_the_days[dtime.getDay()].slice(0,3),
			dayinm: dtime.getDate()
		}
		displayDates.push(date);
	}
	return displayDates
}

var getpriceindict = function(dict, val){
	for (i=0;i<dict.length;i++){
		if (dict[i].currency_code == val){
			return i;
		}
	}
}

	
})();

