(function(){

	var app = angular.module('stats', ['settings', 'ngHtmlCompile', 'kira_tools']);
	
	app.service('config', function(settings) {
		this.USER = settings.USER;
		this.CURRENCIES = settings.CURRENCIES;
		this.SECTORS = settings.SECTORS;
		this.DEF_CURRENCY = settings.DEF_CURRENCY;
		this.LANGUAGES = settings.LANGUAGES;
		this.DEF_LANGUAGE = settings.DEF_LANGUAGE;
		this.LIST_USERNAMES = settings.LIST_USERNAMES;
	});

	app.controller('StatsController', [ '$scope', '$http', 'config', '$timeout', '$window', function($scope, $http, config, $timeout, $window){

		/////////////To list all useful parameters, languages, user infos... ///////
		
				
		// to get user informations
		$scope.session = {};
		config.USER.success(function(data){
			$scope.session = data;
		}).error(function(err){
			console.error(err);
		});
		
		// to get the list of sectors
		$scope.list_sectors = [];
		config.SECTORS.success(function(data){
			$scope.list_sectors = data;
		}).error(function(err){
			console.error(err);
		});
		
		// to get the list of languages
		$scope.list_languages = [];
		config.LANGUAGES.success(function(data){
			$scope.list_languages = data;
		}).error(function(err){
			console.error(err);
		});
		
		// to get the list of currencies
		$scope.list_currencies = [];
		config.CURRENCIES.success(function(data){
			$scope.list_currencies = data;
		}).error(function(err){
			console.error(err);
		});
		
		// to get the default currency
		$scope.default_currency = {};
		config.DEF_CURRENCY.success(function(data){
			$scope.default_currency = data;
		}).error(function(err){
			console.error(err);
		});
		
		// to get the default language
		$scope.default_language = {};
		config.DEF_LANGUAGE.success(function(data){
			$scope.default_language = data;
		}).error(function(err){
			console.error(err);
		});
		
		
		$scope.allcurrencies = [];
		$scope.updateAllCurrencies = function(){
			$scope.allcurrencies = angular.copy($scope.list_currencies);
			$scope.allcurrencies.push($scope.default_currency);
		}
		
		/////////////END list all useful parameters, languages, user infos... ///////
			
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
		
		
		//to display multi-language content in one language
		$scope.displayContent = function(content){
			if (content){
				if ($scope.session.user_language){// if there is a user language defined
					for (i=0; i<content.length; i++){// first check if user language is in content
						if ( content[i].language == $scope.session.user_language && content[i].content ){
							return content[i].content;
						}
					}
				}
				for (i=0; i<content.length; i++){ //then check if default language is in content
					if ( content[i].language == $scope.default_language._id ){
						return content[i].content;
					}
				}
			}
		}
		
		// part to manage the ordering of the stats table
		$scope.predicate = 'date';
		$scope.reverse = true;
		$scope.order = function(predicate) {
			$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
			$scope.predicate = predicate;
		};
		
		
		$scope.list_payments = [];
		$scope.getPayments = function(){
			var period = {
				begin: $scope.datebegin,
				end: $scope.dateend,
			};
			$http.post('/invoices/list_payments', { period: period } )
			.success(function(data){
				$scope.list_payments = data;
				
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.list_invoices = [];
		$scope.getInvoices = function(){
			var period = {
				begin: $scope.datebegin,
				end: $scope.dateend,
			};
			$http.post('/invoices/list_invoices', { period: period } )
			.success(function(data){
				$scope.list_invoices = data;
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.list_reservations = [];
		$scope.getReservations = function(){
			var period = {
				begin: $scope.datebegin,
				end: $scope.dateend,
			};
			$http.post('/reservations/list_reservations', { period: period } )
			.success(function(data){
				$scope.list_reservations = data;
			}).error(function(err){
				console.error(err);
			});
		}

		
		$scope.getStats = function(){
			$scope.getPayments();
			$scope.getInvoices();
			$scope.getReservations();
		}		
		
		// function that calculates the total for the different payments way
		// on the selected period, and assign it to the scope
		
		//// Payments ////
		$scope.$watch('payments.filter.user', function(){
			if ( $scope.payments && $scope.payments.filter && $scope.payments.filter.user == '' ){
				delete $scope.payments.filter.user;
			}
		});
		
		$scope.getTotalPayments = function(){
			if (!$scope.filteredPayments) return 0;
			var totalPayments = 0;
			for ( i=0; i<$scope.filteredPayments.length; i++){
				totalPayments += $scope.filteredPayments[i].amount;
			}
			return totalPayments;
		}
		
		$scope.hidePayment = function(payment){
			var index = $scope.list_payments.indexOf(payment);
			$scope.list_payments.splice(index, 1);
		}
		
		/////// Reservations /////////
		
		$scope.getTotalReservations = function(){
			if (!$scope.filteredReservations) return 0;
			var totalReservations = 0;
			for ( i=0; i<$scope.filteredReservations.length; i++){
				totalReservations += $scope.filteredReservations[i].net;
			}
			return totalReservations;
		}
		
		$scope.hideReservation = function(reservation){
			var index = $scope.list_reservations.indexOf(reservation);
			$scope.list_reservations.splice(index, 1);
		}
		///////// Invoices //////////////
		
		$scope.getTotalInvoices = function(){
			if (!$scope.filteredInvoices) return 0;
			var totalInvoices = 0;
			for ( i=0; i<$scope.filteredInvoices.length; i++){
				totalInvoices += $scope.filteredInvoices[i].net;
			}
			return totalInvoices;
		}
		$scope.hideInvoice = function(invoice){
			var index = $scope.list_invoices.indexOf(invoice);
			$scope.list_invoices.splice(index, 1);
		}
		////////////////////////////
		
		$scope.datebegin = new Date();
		$scope.dateend = new Date();

		$scope.getStats();


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
