(function(){

	var app = angular.module('sales', ['i18n', 'settings', 'ngHtmlCompile']);
	
	app.service('config', function(settings) {
		this.USER = settings.USER;
		this.CURRENCIES = settings.CURRENCIES;
		this.SECTORS = settings.SECTORS;
		this.DEF_CURRENCY = settings.DEF_CURRENCY;
		this.LANGUAGES = settings.LANGUAGES;
		this.DEF_LANGUAGE = settings.DEF_LANGUAGE;
	});
	
	
	app.controller('SalesController', [ '$scope', '$http', 'config', '$timeout', '$window', 'i18n', function($scope, $http, config, $timeout, $window, i18n){
		
		////////// translations
		$scope.i18n = i18n;
		$scope.trans = {};
		$scope.trans.confirm = i18n.__("Confirm");
		$scope.trans.delete_invoice = i18n.__("Are you sure you want to delete this invoice ?");

		i18n.ensureLocaleIsLoaded().then( function() {
			$scope.trans.confirm = i18n.__("Confirm");
			$scope.trans.delete_invoice = i18n.__("Are you sure you want to delete this invoice ?");
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
		
		//function to cancel display of confirmation popup
		$scope.cancelSuperPopup = function(){
			$scope.popupAction = '';
			$scope.show_super_popup = false;
			$scope.superpopup_message="";
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
		
		$scope.hasSectorAccess = function(sector){
			if ($scope.session.rights){
				var rights = $scope.session.rights;
				if ( rights.has_access_all_sectors || rights.is_superuser ){
					return true;
				}
				for (i=0; i<rights.allowed_sectors.length; i++){
					if ( sector._id == rights.allowed_sectors[i] ){
						return true;
					}
				}
			}
			return false;
		}
		
		$scope.list_products = [];
		$scope.updateProducts = function(sector_id){
			$http.get('/products/productsFromSector/' + sector_id).success(function(data){
				$scope.list_products = data;
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.list_categories = [];
		$scope.updateCategories = function(sector_id){
			$http.get('/products/categoriesFromSector/' + sector_id).success(function(data){
				$scope.list_categories = data;
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.openinvoices_list = [];
		$scope.getInvoicesList = function(sector_id){
			$http.get('/invoices/list_sub_invoices/' + sector_id).success(function(data){
				$scope.openinvoices_list = data;
			}).error(function(err){
				console.error(err);
			});
		}
		
		//select sector
		$scope.selectSector = function(sector){
			$scope.sector_actif = sector;
			$scope.updateProducts(sector._id);
			$scope.updateCategories(sector._id);
			$scope.getInvoicesList(sector._id);
						
		}
		$scope.setActiveCat = function(category){
			$scope.active_category = category._id;
			$scope.setQuantInput();
		}
		
		$scope.quantFocus = true;
		$scope.newinvFocus = true;
		
		$scope.setQuantInput = function(){
			$scope.quantFocus = !$scope.quantFocus;
			$scope.quantity = null;
		}
		
		
		
		//function to add empty invoice
		$scope.addInvoice = function(){
			$http.post('/invoices/create_sub_invoice/', {new_inv: $scope.newInvoice, sector_id: $scope.sector_actif._id})
			.success(function(data){
				$scope.openinvoices_list.push(data);
				$scope.newInvoice = {};
			}).error(function(err){
				console.error(err);
			});			
		}
		
		$scope.selectInv = function(invoice){
			$scope.invoice_selected = invoice;
		}
		
		$scope.selectProd = function(product){
			if ( $scope.invoice_selected && $scope.invoice_selected != "new"){
				if ( $scope.quantity && isInt($scope.quantity) ){
					var q = $scope.quantity;
				} else {
					var q = 1;
				}
				$http.post('/invoices/add_item', {item: product, quantity: q, invoice_id: $scope.invoice_selected._id })
				.success(function(data){
					$scope.invoice_selected.items = data.invoice.items;
					$scope.invoice_selected.total = data.invoice.total;
					$scope.invoice_selected.net = data.invoice.net;
					$scope.invoice_selected.amount_due = data.invoice.amount_due;
					$scope.invoice_selected.amount_paid = data.invoice.amount_paid;
					
					$scope.setQuantInput();
				}).error(function(err){
					console.error(err);
				});
				
			}
		}
		
		$scope.activeDeleting = function(){
			$scope.deletionActive = !$scope.deletionActive;
		}
		
		$scope.selectItem = function(item){
			if ($scope.deletionActive){
				$http.post('/invoices/remove_item', { invoice_id: $scope.invoice_selected._id, item_id: item._id })
				.success(function(data){
					$scope.deletionActive = false;
					$scope.invoice_selected.items = data.items;
					$scope.invoice_selected.total = data.total;
					$scope.invoice_selected.net = data.net;
					$scope.invoice_selected.amount_due = data.amount_due;
					$scope.invoice_selected.amount_paid = data.amount_paid;
					
					
				}).error(function(err){
					console.error(err);
					$scope.deletionActive = false;
				});
			}
		}
		
		
		//function to ask confirmation for invoice delete
		$scope.askInvoiceDelete = function(){
			$scope.popupAction = "<button class='btn btn-default' ng-click='deleteInvoice()'>"+ $scope.trans.confirm +"</button>";
			$scope.superpopup_message = $scope.trans.delete_invoice;
			$scope.show_super_popup = true;
		}
		
		$scope.deleteInvoice = function(){
			$http.post('/invoices/delete_sub_invoice', { invoice_id: $scope.invoice_selected._id })
			.success(function(data){
				var index = $scope.openinvoices_list.indexOf($scope.invoice_selected)
				$scope.openinvoices_list.splice(index, 1);
				$scope.cancelSuperPopup();
			}).error(function(err){
				console.error(err);
			});
		}
		
		
		/////////////// CLIENT ASSIGN ///////////////
		
		//to get list of reservations checkedin
		$scope.getCheckedIn = function() {
			$http.get('/reservations/checkedin').success(function(data){
				$scope.checkedIn = data;
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.attachtoclient = function(){
			if ($scope.invoice_selected.client) {
				$scope.reqclient = $scope.invoice_selected.client;
			} else {
				$scope.reqclient = {};
			}
			$scope.getCheckedIn();
			$scope.showClientAttachement = true;
		}
		
		// function called when user is modifiying a client field, to look for the list of clients
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
		$scope.selectClient = function(n){
			$scope.reqclient = $scope.clientsFetch[n];
			$scope.clientQueryResult = "";
			$scope.clientsFetch = [];
		}
		
		$scope.attachcheckedin = function(client){
			$scope.reqclient = client;
		}
		$scope.cancelAttachClient = function(){
			$scope.showClientAttachement = false;
			$scope.reqclient = {};
			$scope.clientQueryResult = '';
		}
		$scope.addClientToInvoice = function(){
			$http.post('/invoices/add_client', { invoice_id: $scope.invoice_selected._id, client_id: $scope.reqclient._id })
			.success(function(data){
				$scope.invoice_selected.client = data;
				$scope.cancelAttachClient();
			}).error(function(err){
				console.error(err);
			});
		}
		$scope.detachClient = function(){
			$http.post('invoices/detach_client', { invoice_id: $scope.invoice_selected._id })
			.success(function(data){
				$scope.invoice_selected.client = "";
				$scope.cancelAttachClient();
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.showCliForm = function(){
			$scope.divform = true;
			$scope.newclient = {};
		}
		$scope.cancelCliForm = function(){
			$scope.divform = false;
			$scope.newclient = {};
		}
		
		$scope.addClient = function(){
			$http.post('/clients/add', {newclient : $scope.newclient}).success(function(data){
				$scope.reqclient = data;
				$scope.cancelCliForm();
			}).error(function(err){
				console.error(err);
			});			
		}
		
		/////////////// END CLIENT ASSIGN ///////////////
		
		
		//////////// PRINTING //////////////
		
		$scope.startPrintForm = function(){
			$scope.showPrintForm = true;
			$scope.printing = {};
			
			$scope.updateAllCurrencies();
			
			if ( $scope.invoice_selected.client ){
				$scope.printing.language = $scope.invoice_selected.client.language;
			} else {
				$scope.printing.language = $scope.default_language._id;
			}
			$scope.printing.currency = $scope.default_currency._id;
		}
		
		$scope.cancelInvoicePrint = function(){
			$scope.showPrintForm = false;
			$scope.printing = {};
			
		}
		
		$scope.printInvoice = function(){
			var lang = $scope.printing.language;
			var cur = $scope.printing.currency;
			$window.open('/invoices/print_subinvoice/' + $scope.invoice_selected._id + '/' + lang + '/' + cur);
			$scope.cancelInvoicePrint();
		}
		
		//////////// END PRINTING //////////////
		
		//////////// DISCOUNT //////////////////
		
		$scope.startDiscountForm = function(){
			if ( $scope.invoice_selected.discount ){
				$scope.discount = angular.copy($scope.invoice_selected.discount);
			} else {
				$scope.discount = {};
			}
			$scope.showDiscountForm = true;
		}
		
		$scope.cancelDiscount = function(){
			$scope.discount = {};
			$scope.showDiscountForm = false;
		}
		
		$scope.calculAmountDiscount = function(){
			$scope.discount.amount = $scope.invoice_selected.total * $scope.discount.percent / 100;
		}
		
		$scope.addDiscount = function(){
			$http.post('/invoices/add_discount', { invoice_id: $scope.invoice_selected._id, discount: $scope.discount })
			.success(function(data){
				$scope.invoice_selected.discount = data.discount;
				$scope.invoice_selected.total = data.total;
				$scope.invoice_selected.net = data.net;
				$scope.cancelDiscount();
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		$scope.selectDiscount = function(){
			if ($scope.deletionActive){
				$http.post('/invoices/remove_discount', { invoice_id: $scope.invoice_selected._id })
				.success(function(data){
					$scope.deletionActive = false;
					$scope.invoice_selected.discount = data.discount;
					$scope.invoice_selected.total = data.total;
					$scope.invoice_selected.net = data.net;
					
				}).error(function(err){
					console.error(err);
					$scope.deletionActive = false;
				});
			}
		}
		
		//////////// END DISCOUNT //////////////////
		
		////////////// PAYMENT /////////////////
		
		$scope.onePayment = true;
		$scope.startPayment = function(){
			
			$scope.updateAllCurrencies();
			$scope.clientCheckedIn = false;
			if ( $scope.invoice_selected.client && $scope.invoice_selected.client._id ){
				$scope.checkIfClientCheckedIn($scope.invoice_selected.client);
			}
			$scope.showPaymentForm = true;
			$scope.newPayment = {};
			$scope.pay_selected = "";
			$scope.newPayment.type = 'subinvoice'
			$scope.newPayment.amount = $scope.invoice_selected.amount_due;
			$scope.newPayment.cashreceived = $scope.invoice_selected.amount_due;
		}
		
		$scope.cancelPayment = function(){
			$scope.showPaymentForm = false;
			$scope.newPayment = {};
			$scope.clientCheckedIn = false;
		}
		
		// to check if a client is checked in
		$scope.clientCheckedIn = false;
		$scope.checkIfClientCheckedIn = function(client){
			$http.post('/clients/ischeckedin', { client_id: client._id })
			.success(function(data){
				$scope.clientCheckedIn = data;
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		$scope.confirmPayment = function(way){
			$scope.load();
			$scope.newPayment.way = way;
			$http.post('/invoices/add_payment', { payment: $scope.newPayment, invoice_id: $scope.invoice_selected._id })
			.success(function(data){
				$scope.invoice_selected.amount_paid = data.amount_paid;
				$scope.invoice_selected.amount_due = data.amount_due;
				if ( data.paid ){
					$scope.cancelPayment();
					$scope.invoice_selected = {};
					$scope.getInvoicesList($scope.sector_actif._id);
				} else {
					$scope.startPayment();
				}
				$scope.validateAction('payment registered', 'success')
			}).error(function(err){
				$scope.validateAction(err, 'error');
				console.error(err);
			});
		}
				
		$scope.checkoutPayment = function(){
			$scope.load();
			$http.post('/invoices/add_to_reservation_invoice', { invoice: $scope.invoice_selected })
			.success(function(data){
				$scope.validateAction(data, 'success');
				$scope.cancelPayment();
				$scope.invoice_selected = {};
				$scope.getInvoicesList($scope.sector_actif._id);
			}).error(function(err){
				$scope.validateAction(err, 'error');
				console.log(err);
			});
		}
		
		////////////// END PAYMENT /////////////////
		
		
	}]);

	app.directive('focus', function($timeout) {
		return {
			scope : {
				trigger : '@focus'
			},
			link : function(scope, element) {
				scope.$watch('trigger', function(value) {
					$timeout(function() {
						element[0].focus();
					});
				
				});
			}
		};
	
	}); 

var isInt = function(n) { return parseInt(n) === n };

})();
