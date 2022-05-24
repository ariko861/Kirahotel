(function(){

	var app = angular.module('kira_tools', []);
	
	app.directive('printInvoice', function($window) {
		return {
			scope: {
				printInvoice: '=',
				language: '=',
				currency: '=',
			},
			link: function(scope, element) {
				element.on('click', function(){
					$window.open('/invoices/print_subinvoice/' + scope.printInvoice + '/' + scope.language + '/' + scope.currency );
				});
			}		
		}
	});
	
	app.directive('printReservation', function($window) {
		return {
			scope: {
				printReservation: '=',
				language: '=',
				currency: '=',
			},
			link: function(scope, element) {
				element.on('click', function(){
					$window.open('/reservations/print_reservation/' + scope.printReservation + '/' + scope.language + '/' + scope.currency );
				});
			}		
		}
	});
	
	app.directive('printDocument', function($window) {
		return {
			scope: {
				printDocument: '=',
				language: '=',
				currency: '=',
				doctype: '=',
			},
			link: function(scope, element) {
				element.on('click', function(){
					console.log(scope.doctype);
					switch (scope.doctype) {
						case 'reservation':
							var url = '/reservations/print_reservation/';
							break;
						case 'subinvoice':
							var url = '/invoices/print_subinvoice/';
							break;
						case 'globalinvoice':
							var url = '/invoices/print_global_invoice/';
							break;
						
					}
					$window.open( url + scope.printDocument + '/' + scope.language + '/' + scope.currency );
				});
			}		
		}
	});
	
	app.directive('departureTimeFromNow', function(){
		return {
			scope: {
				departureTimeFromNow: '=',
			},
			link: function(scope, element){
				var timeleft = moment(scope.departureTimeFromNow).fromNow();
				element.html(timeleft);
				//$compile(element.contents())(scope);
			}
		}
	});
	
	app.directive('displayDate', function(){
		return {
			scope: {
				displayDate: '=',
			},
			link: function(scope, element){
				var date = moment(scope.displayDate).format('ll');
				element.html(date);
			}
		}
	});
	
	app.directive('displayTime', function(){
		return {
			scope: {
				displayTime: '=',
			},
			link: function(scope, element){
				var date = moment(scope.displayTime).format('llll');
				element.html(date);
			}
		}
	});
	
	
	
	/*
	app.directive('otherCurrencies', function($compile) {
		return {
			scope: {
				otherCurrencies: '=',
				this_amount: '=',
				this_currency: '=',
			},
			link: function(scope, element) {
				scope.$watch('this_amount', function(newValue, oldValue) {
						var onmouse = "";
						console.log(scope.this_amount)
						console.log(scope.otherCurrencies)
						console.log(scope.this_currency)
							
						for(i=0; i< scope.otherCurrencies.length; i++){
							
							onmouse += "(" + scope.otherCurrencies[i].code + ") : " + ( newValue * scope.otherCurrencies[i].foronedollar / scope.this_currency.foronedollar ) + scope.otherCurrencies[i].symbol + "\n"; 
						}
						element.attr('placeholder', onmouse);
					
				}, true);
			}
		}
	});*/
	
})();
