(function(){

	var app = angular.module('dashboard', ['settings', 'kira_tools', 'ngHtmlCompile', 'i18n']);
	
	app.service('config', function(settings) {
		this.USER = settings.USER;
		this.CURRENCIES = settings.CURRENCIES;
		this.SECTORS = settings.SECTORS;
		this.DEF_CURRENCY = settings.DEF_CURRENCY;
		this.LANGUAGES = settings.LANGUAGES;
		this.DEF_LANGUAGE = settings.DEF_LANGUAGE;
	});
	
	app.controller('DashBoardController', [ '$scope', '$http', '$timeout', 'config', 'i18n', function($scope, $http, $timeout, config, i18n){
		
		////////// Charge translations
		
		$scope.i18n = i18n;
		$scope.trans = {};
		$scope.trans.was_checkedin = i18n.__("the client was checked in");
		$scope.trans.payment_registered = i18n.__('payment registered');
		$scope.trans.invoice = i18n.__('Invoice');
		$scope.trans.invoice_number = i18n.__("Invoice number");
		$scope.trans.date = i18n.__("Date");
		$scope.trans.sector = i18n.__("Sector");
		$scope.trans.net_total = i18n.__("Net total");
		$scope.trans.amount_paid = i18n.__("Amount paid");
		$scope.trans.amount_due = i18n.__("Amount due");
		$scope.trans.pay = i18n.__("Pay");
		
		i18n.ensureLocaleIsLoaded().then( function() {
			$scope.trans.was_checkedin = i18n.__("the client was checked in");
			$scope.trans.payment_registered = i18n.__('payment registered');
			$scope.trans.invoice = i18n.__('Invoice');
			$scope.trans.invoice_number = i18n.__("Invoice number");
			$scope.trans.date = i18n.__("Date");
			$scope.trans.sector = i18n.__("Sector");
			$scope.trans.net_total = i18n.__("Net total");
			$scope.trans.amount_paid = i18n.__("Amount paid");
			$scope.trans.amount_due = i18n.__("Amount due");
			$scope.trans.pay = i18n.__("Pay");				
		});
		
		
		
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
		
		
		$scope.list_invoices = [];
		$scope.reservations = [];
		$scope.departures = [];
		$scope.checkedIn = [];
		$scope.board_selected = 'A';
		
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
			}, 3500);
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
		
		$scope.getArrivals = function(date){
			var date_raw = new Date(date);
			var beg = new Date( date_raw.setHours(0,0,0,0) );
			var end = new Date( date_raw.setHours(23,59,59,999) );
			$http.post('/reservations/arrivals', { begin: beg, end: end }).success(function(data){
				if ( data && data.length > 0 ) {
					$scope.nores = false;
					$scope.reservations = data;
				} else {
					$scope.nores = true;
				}
			}).error(function(error){
				console.error(err);
			});	
			
		}
		
		$scope.getDepartures = function(date){
			var date_raw = new Date(date);
			var beg = new Date( date_raw.setHours(0,0,0,0) );
			var end = new Date( date_raw.setHours(23,59,59,999) );
			$http.post('/reservations/departures', { begin: beg, end: end }).success(function(data){
				if ( data && data.length > 0 ) {
					$scope.nodep = false;
					$scope.departures = data;
				} else {
					$scope.nodep = true;
				}
			}).error(function(error){
				console.error(err);
			});	
			
		}
		
		$scope.getCheckedIn = function() {
			$http.get('/reservations/checkedin').success(function(data){
				$scope.checkedIn = data;
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		
		var today = new Date();
		$scope.getArrivals( today );
		$scope.getDepartures( today );
		$scope.getCheckedIn();
		
		
		$scope.chargeRes = function(reservation) {
			$scope.display_res = reservation;
			$scope.client_d = reservation.client;
			$scope.room_d = reservation.room;
		}
		
		$scope.chargeDep = function(reservation) {
			$scope.display_dep = reservation;
			$scope.client_dep = reservation.client;
			$scope.room_dep = reservation.room;
		}
		
		$scope.checkIn = function() {
			$scope.load();
			$http.post('/reservations/checkin', {id: $scope.display_res._id}).success(function(data){
				$scope.checkedIn.push(data);
				var index = getindexindict($scope.reservations, data._id);
				$scope.reservations[index].status = 'checkedin';
				$scope.display_res = {};
				$scope.client_d = {};
				$scope.room_d = {};
				$scope.checkInConf = false;
				$scope.validateAction( $scope.trans.was_checkedin, 'success')
			}).error(function(err){
				console.error(err);
				$scope.validateAction(err, 'error');
			});
		}
		
		
		$scope.list_invoices_client = [];
		$scope.list_reservations_client = [];
		$scope.roomInvoices = {};
		
		$scope.getRoomGlobalInvoices = function(room_id){
			$http.post('/invoices/get_room_global_invoice', { room_id: room_id })
			.success(function(data){
				$scope.roomInvoices[room_id] = data;
				
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.amount_due = {};
		$scope.getClientInvoices = function(client_id){
			$scope.amount_due[client_id] = 0;
			$http.post('/invoices/get_client_invoices', { client_id: client_id })
			.success(function(data){
				$scope.list_invoices_client = data;
				for ( i=0; i<data.length; i++ ){
					$scope.amount_due[client_id] += data[i].amount_due;
				}
			}).error(function(err){
				console.error(err);
			});
			
			$http.post('/reservations/get_client_reservations', { client_id: client_id })
			.success(function(data){
				$scope.list_reservations_client = data;
				for ( i=0; i<data.length; i++ ){
					$scope.amount_due[client_id] += data[i].amount_due;
				}
				
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		$scope.openGlobInvoices = [];
		$scope.getOpenGlobalInvoices = function(){
			$http.get('/invoices/list_open_global_invoices').success(function(data){
				$scope.openGlobInvoices = data;
			}).error(function(err){
				console.error(err);
			});
		}
		$scope.getOpenGlobalInvoices();
		
		
		
		
		
		/// Modifs 6 fevrier 2016
		
		//////// TO MANAGE GLOBAL PAYMENTS  //////////////////
		
		$scope.newGlobalPayment = {};
		
		$scope.startGlobalPayment = function(client){
			$scope.getClientInvoices(client._id);
			$scope.showGlobalPaymentForm = true;
			$scope.newGlobalPayment = {};
			$scope.newGlobalPayment.client = client;
			$scope.newGlobalPayment.reservations = [];
			$scope.newGlobalPayment.subinvoices = [];
			
		}
		
		$scope.cancelGlobalPayment = function(){
			$scope.showGlobalPaymentForm = false;
			$scope.newGlobalPayment = {};
		}
		$scope.globPayIsNotNull = function() {
			if ($scope.newGlobalPayment.reservations && $scope.newGlobalPayment.reservations.length > 0 ) {
				return true;
			}
			if ( $scope.newGlobalPayment.subinvoices && $scope.newGlobalPayment.subinvoices.length > 0 ) {
				return true;
			}
			return false;
			
		}
		
		// to add ('add' in options) or remove ('del' in options) 
		// reservation to/from the global invoice
		$scope.toggleResPay = function(res, dir){
			if ( dir === 'add') {
				var list_to = $scope.newGlobalPayment.reservations;
				var list_from = $scope.list_reservations_client;
			} else if ( dir === 'del'){
				var list_to = $scope.list_reservations_client;
				var list_from = $scope.newGlobalPayment.reservations;
			}
			list_to.push(res);
			var i = list_from.indexOf(res);
			if(i != -1) {
				list_from.splice(i, 1);
			}
			$scope.getTotalGlobPayment()
		}

		// to add ('add' in options) or remove ('del' in options) 
		// invoices to/from the global invoice
		$scope.toggleInvPay = function(inv, dir){
			if ( dir === 'add') {
				var list_to = $scope.newGlobalPayment.subinvoices;
				var list_from = $scope.list_invoices_client;
			} else if ( dir === 'del'){
				var list_to = $scope.list_invoices_client;
				var list_from = $scope.newGlobalPayment.subinvoices;
			}
			list_to.push(inv);
			var i = list_from.indexOf(inv);
			if(i != -1) {
				list_from.splice(i, 1);
			}
			$scope.getTotalGlobPayment();
		}
		
		$scope.getTotalGlobPayment = function(){
			var total = 0;
			var amount_paid = 0;
			if ( $scope.newGlobalPayment.reservations ){
				for (i=0; i < $scope.newGlobalPayment.reservations.length; i++ ){
					total += $scope.newGlobalPayment.reservations[i].net;
					amount_paid += $scope.newGlobalPayment.reservations[i].amount_paid;
				}
			}
			if ( $scope.newGlobalPayment.subinvoices ){
				for (i=0; i < $scope.newGlobalPayment.subinvoices.length; i++ ){
					total += $scope.newGlobalPayment.subinvoices[i].net;
					amount_paid += $scope.newGlobalPayment.subinvoices[i].amount_paid;
				}
			}
			$scope.newGlobalPayment.total = total;
			$scope.newGlobalPayment.amount_paid = amount_paid;
			$scope.newGlobalPayment.amount_due = total - amount_paid;
			
		}
		$scope.onePayment = true;
		
		$scope.processGlobalPayment = function(){
			$scope.onePayment = true;
			$scope.updateAllCurrencies();
			
			$scope.showPaymentForm = true;
			
			$scope.newPayment = {};
			$scope.newPayment.type = 'global';
			$scope.invoice_selected = {};
			$scope.invoice_selected.amount_due = $scope.newGlobalPayment.amount_due;
			$scope.newPayment.amount = $scope.newGlobalPayment.amount_due;
			$scope.newPayment.cashreceived = $scope.newGlobalPayment.amount_due;
		}
		
		$scope.startAnyPayment = function(document, type){
			$scope.onePayment = true;
			$scope.updateAllCurrencies();
			$scope.showPaymentForm = true;
			
			$scope.newPayment = {};
			$scope.newPayment.type = type;
			$scope.invoice_selected = document;
			$scope.newPayment.amount = document.amount_due;
			$scope.newPayment.cashreceived = document.amount_due;
			
		}
		
		$scope.cancelPayment = function(){
			$scope.showPaymentForm = false;
			$scope.newPayment = {};
			
		}
		
		
		$scope.confirmPayment = function(way){
			$scope.load();
			$scope.newPayment.way = way;
			if ( $scope.newPayment.type == 'global' ){
				$http.post('/invoices/add_global_payment', { payment: $scope.newPayment, documents: $scope.newGlobalPayment })
				.success(function(data){
					$scope.getCheckedIn();
					$scope.validateAction( $scope.trans.payment_registered, 'success')
				}).error(function(err){
					$scope.validateAction(err, 'error');
					console.error(err);
				});
				
			} else if ( $scope.newPayment.type == 'reservation' ) {
				$http.post('/reservations/add_payment', { payment: $scope.newPayment, id: $scope.invoice_selected._id } )
				.success(function(data){
					$scope.getCheckedIn();
					$scope.validateAction( $scope.trans.payment_registered, 'success');
				}).error(function(err){
					$scope.validateAction(err, 'error');
					console.error(err);
				});
			} else if ( $scope.newPayment.type == 'invoice' ) {
				$http.post('/invoices/subinvoices/add_payment', { payment: $scope.newPayment, id: $scope.invoice_selected._id } )
				.success(function(data){
					$scope.getCheckedIn();
					$scope.validateAction( $scope.trans.payment_registered, 'success');
				}).error(function(err){
					$scope.validateAction(err, 'error');
					console.error(err);
				});
			}
				
		}
		
		
		//////// TO MANAGE GLOBAL INVOICES //////////////////
		
		
		$scope.newGlobalInvoice = {};
		
		$scope.startGlobalInvoice = function(client, room_id){
			$scope.getClientInvoices(client._id);
			$scope.showGlobalInvoiceForm = true;
			$scope.newGlobalInvoice = {};
			$scope.newGlobalInvoice.client = client;
			$scope.newGlobalInvoice.room = room_id;
			$scope.newGlobalInvoice.reservations = [];
			$scope.newGlobalInvoice.subinvoices = [];
			
		}
		
		$scope.cancelGlobalInvoice = function(){
			$scope.showGlobalInvoiceForm = false;
			$scope.newGlobalInvoice = {};
			$scope.getOpenGlobalInvoices();
			$scope.getCheckedIn();
		}
		$scope.globIsNotNull = function() {
			if ($scope.newGlobalInvoice.reservations && $scope.newGlobalInvoice.reservations.length > 0 ) {
				return true;
			}
			if ( $scope.newGlobalInvoice.subinvoices && $scope.newGlobalInvoice.subinvoices.length > 0 ) {
				return true;
			}
			return false;
			
		}
		
		// to add ('add' in options) or remove ('del' in options) 
		// reservation to/from the global invoice
		$scope.toggleResGlob = function(res, dir){
			if ( dir === 'add') {
				var list_to = $scope.newGlobalInvoice.reservations;
				var list_from = $scope.list_reservations_client;
			} else if ( dir === 'del'){
				var list_to = $scope.list_reservations_client;
				var list_from = $scope.newGlobalInvoice.reservations;
			}
			list_to.push(res);
			var i = list_from.indexOf(res);
			if(i != -1) {
				list_from.splice(i, 1);
			}
			$scope.getTotalGlobInvoice()
		}

		// to add ('add' in options) or remove ('del' in options) 
		// invoices to/from the global invoice
		$scope.toggleInvGlob = function(inv, dir){
			if ( dir === 'add') {
				var list_to = $scope.newGlobalInvoice.subinvoices;
				var list_from = $scope.list_invoices_client;
			} else if ( dir === 'del'){
				var list_to = $scope.list_invoices_client;
				var list_from = $scope.newGlobalInvoice.subinvoices;
			}
			list_to.push(inv);
			var i = list_from.indexOf(inv);
			if(i != -1) {
				list_from.splice(i, 1);
			}
			$scope.getTotalGlobInvoice();
		}
		
		$scope.getTotalGlobInvoice = function(){
			var total = 0;
			var amount_paid = 0;
			if ( $scope.newGlobalInvoice.reservations ){
				for (i=0; i < $scope.newGlobalInvoice.reservations.length; i++ ){
					total += $scope.newGlobalInvoice.reservations[i].net;
					amount_paid += $scope.newGlobalInvoice.reservations[i].amount_paid;
				}
			}
			if ( $scope.newGlobalInvoice.subinvoices ){
				for (i=0; i < $scope.newGlobalInvoice.subinvoices.length; i++ ){
					total += $scope.newGlobalInvoice.subinvoices[i].net;
					amount_paid += $scope.newGlobalInvoice.subinvoices[i].amount_paid;
				}
			}
			$scope.newGlobalInvoice.total = total;
			$scope.newGlobalInvoice.amount_paid = amount_paid;
			
		}
		
		$scope.submitGlobalInvoice = function(){
			$http.post('/invoices/createGlobalInvoice', { newInv: $scope.newGlobalInvoice })
			.success(function(data){
				$scope.cancelGlobalInvoice();
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.removeGlobalInvoice = function(invoice){
			$scope.load();
			$http.post('/invoices/cancel_global_invoice', { invoice_id: invoice._id })
			.success(function(data){
				$scope.validateAction(data, 'success');
				$scope.getCheckedIn();
			}).error(function(err){
				console.error(err);
				$scope.validateAction(err, 'error');
			});
		}
		
		
		$scope.confirmCheckOut = function(reservation){
			$scope.checkingOut = reservation;
			$scope.checkOutConf = true;
		}
		
		$scope.cancelCheckOut = function(){
			$scope.checkingOut = {};
			$scope.checkOutConf = false;
		}
		
		$scope.checkOut = function(){
			$scope.load();
			$http.post('/reservations/checkOut', { reservation: $scope.checkingOut })
			.success(function(data){
				$scope.getCheckedIn();
				$scope.cancelCheckOut();
				$scope.validateAction(data, 'success');
			}).error(function(err){
				console.error(err);
				$scope.cancelCheckOut();
				$scope.validateAction(err, 'error');
			});
			
		}
		////////////////TO MANAGE PAIMENT OF INVOICE//////////////////
		/*
		$scope.onePayment = true;
		
		$scope.launchPayment = function(invoice){
			
			$scope.onePayment = true;
			$scope.invoice_selected = invoice;
			$scope.updateAllCurrencies();
			$scope.clientCheckedIn = false;
			
			$scope.showPaymentForm = true;
			$scope.newPayment = {};
			$scope.newPayment.type = 'invoice'
			$scope.newPayment.amount = invoice.amount_due;
			$scope.newPayment.cashreceived = invoice.amount_due;
		}
		
		$scope.cancelPayment = function(){
			$scope.showPaymentForm = false;
			$scope.newPayment = {};
			$scope.invoice_selected = {};
			$scope.clientCheckedIn = false;
		}
		
		$scope.confirmPayment = function(way){
			$scope.load();
			$scope.newPayment.way = way;
			if ( $scope.newPayment.global ){
				
			} else {
			
				$http.post('/invoices/add_global_payment', { payment: $scope.newPayment, invoice_id: $scope.invoice_selected._id })
				.success(function(data){
					$scope.invoice_selected.amount_paid = data.amount_paid;
					$scope.invoice_selected.amount_due = data.amount_due;
					$scope.getOpenGlobalInvoices();
					if ( data.paid ){
						$scope.cancelPayment();
						$scope.invoice_selected = {};
					} else {
						$scope.launchPayment($scope.invoice_selected);
					}
					$scope.validateAction('payment registered', 'success')
				}).error(function(err){
					$scope.validateAction(err, 'error');
					console.error(err);
				});
			}
		}
		*/
		////////////////END TO MANAGE PAIMENT OF INVOICE//////////////////
		
		
		///////////////////////////TO MANAGE CLIENTS IN GLOBAL INVOICES ///////
		
		$scope.clientQueryResult = "";
		$scope.fetchClientSearch = function(query){
			if (query && query.length >= 3){
				$http.post('/clients/fetch', { query : query }).success(function(result){
					$scope.clientQueryResult = '';
					$scope.clientsFetch = result;
					for ( i=0 ; i<result.length ; i++){
						$scope.clientQueryResult += "<li class='input_query_result' ng-click='selectClient(" + i + ")'>" + result[i].full_name + "</li>";
					}
				}).error(function(err){
					console.error(err);
				});
			} else {
				$scope.clientQueryResult = "";
			}
		}
		// function called when click on clients list
		// in query result
		$scope.selectClient = function(n){
			$scope.newGlobalInvoice.client = $scope.clientsFetch[n];
			$scope.clientQueryResult = "";
			$scope.clientsFetch = [];
		}
		
		// to show new client form
		$scope.showCliForm = function(){
			$scope.divform = true;
			$scope.newclient = {};
		}
		// to stop new client form
		$scope.cancelCliForm = function(){
			$scope.divform = false;
			$scope.newclient = {};
		}
		
		// to add client once the form is filled
		$scope.addClient = function(){
			$http.post('/clients/add', {newclient : $scope.newclient}).success(function(data){
				$scope.newGlobalInvoice.client = data;
				$scope.cancelCliForm();
			}).error(function(err){
				console.error(err);
			});			
		}
		
		///////////////////////////END TO MANAGE CLIENTS IN GLOBAL INVOICES ///////
		
		//////// END TO MANAGE GLOBAL INVOICES //////////////////
		
		
	}]);	
	
	app.directive('fillClientInvoices', function($http, $compile) {
		return {
			/*scope: {
				customer: '=',
			},*/
			link: function(scope, element) {
				$http.post('/invoices/get_client_invoices', {client_id: scope.res.client._id})
				.success(function(data){
					scope.list_invoices[scope.res.client._id] = data;
					if ( data.length > 0 ){
						var html = "<h3>"+ scope.trans.invoice +"</h3>"
						html += "<table class='table table-bordered'>";
						html += "<thead><tr>";
						html += "<td>"+ scope.trans.invoice_number +"</td>";
						html += "<td>"+ scope.trans.date +"</td>";
						html += "<td>"+ scope.trans.sector +"</td>";
						html += "<td>"+ scope.trans.net_total +"</td>";
						html += "<td>"+ scope.trans.amount_paid +"</td>";
						html += "<td>"+ scope.trans.amount_due +"</td>";
						html += "<td></td>"
						html+="</tr></thead>"
						html += "<tr ng-repeat='invoice in list_invoices[res.client._id]'>";
						html += "<td><a href print-invoice='invoice._id' language='session.user_language || default_language._id' currency='default_currency._id'>{{invoice._id}}</a></td>";
						html += "<td display-date='invoice.date'></td>";
						html += "<td>{{displayContent(invoice.sector.name)}}</td>"
						html += "<td class='price'>{{invoice.net | number:2}} {{default_currency.symbol}}</td>";
						html += "<td class='price'>{{invoice.amount_paid | number:2}} {{default_currency.symbol}}</td>";
						html += "<td class='price'>{{invoice.amount_due | number:2}} {{default_currency.symbol}}</td>";
						html += "<td><button class='btn btn-primary' ng-show='invoice.amount_due > 0' ng-click='startAnyPayment(invoice, \"invoice\")'>"+ scope.trans.pay +"</button></td>"
						html += "</tr>";	
					
						html += "</table>";
						element.html(html);
						$compile(element.contents())(scope);
					}
				}).error(function(err){
					console.error(err);
				});				
			}
		}
	});
/*	
	app.directive('departureTimeFromNow', function($compile){
		return {
			link: function(scope, element){
				var timeleft = moment(scope.res.end).fromNow();
				element.html(timeleft);
				$compile(element.contents())(scope);
			}
		}
	});
*/	
	
var getindexindict = function(dict, val){
	for (i=0;i<dict.length;i++){
		if (dict[i]._id == val){
			return i;
		}
	}
}

})();
