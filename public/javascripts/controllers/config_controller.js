(function(){

	var app = angular.module('config', ['settings', 'ngFileUpload']);
	
	app.service('config', function(settings) {
		this.USER = settings.USER;
		this.SECTORS = settings.SECTORS;
	});
	
	app.controller('ConfigController', [ '$scope', '$http', 'config', '$timeout', 'Upload', function($scope, $http, config, $timeout, Upload){
		$scope.currency_list = [];
		$scope.sector_list = [];
		$scope.newSector = {};
		$scope.showAddSectForm = false;
		
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
		
		
		$scope.toggleAddSectForm = function(){
			$scope.showAddSectForm = ( $scope.showAddSectForm == false );
		}
		
		$http.get('/config/listcurrencies').success(function(data){
			$scope.currency_list = data;
			
		}).error(function(err){
			console.error(err);
		});
		
		config.SECTORS.success(function(data){
			$scope.sector_list = data;
			
		}).error(function(err){
			console.error(err);
		});
		
		
		$scope.addSector = function(){
			var newsector = $scope.newSector;
			newsector.name = [];
			var languages = $scope.list_languages;
			//pass from arrays to array of dictionnaries names and descriptions
			for ( i=0; i<languages.length; i++){
				var lang = languages[i]._id;
				var singlename = {
					content: newsector.names[lang],
					language: lang,
				}
				newsector.name.push(singlename)				
			}
			
			$http.post('/products/add_sector', { new_sector: newsector })
			.success(function(data){
				$scope.newSector = {};
				$scope.sector_list.push(data);
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.displayName = function(name, language){
			for (i=0; i<name.length; i++){
				if ( name[i].language == language._id){
					return name[i].content;
				}
			}
			
		}
		
		/////////// CONFIG CURRENCIES ///////////
		
		$scope.showAddCurrencyForm = false;
		// to toggle the display of the new lang form
		$scope.toggleAddCurrencyForm = function(){
			$scope.showAddCurrencyForm = ( $scope.showAddCurrencyForm == false );
		}
		
		$scope.addCurrency = function(){
			$http.post('/config/add_currency', { new_currency: $scope.newcurrency })
			.success(function(data){
				$scope.newcurrency = {};
				$scope.currency_list.push(data);
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.setActive = function(code, boolean){
			
			$http.post('/config/setActiveCurrency', {code: code, boolean: boolean}).success(function(data){
				console.log(data);
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		$scope.setCurrencyRate = function(currency){
			$scope.load();
			$http.post('/config/updateRate', {currency: currency})
			.success(function(data){
				$scope.validateAction(data, 'success');
			}).error(function(err){
				console.error(err);
				$scope.validateAction(err, 'error');
			});
			
		}			
		
		$scope.setCurrencyDefault = function(currency){
			if ( currency.by_default == 1 ){
				for ( i=0; i<$scope.currency_list.length; i++ ){
					$scope.currency_list[i].by_default = false;
				}
				currency.by_default = true;
			
				$http.post('/config/setdefaultcurrency', {id: currency._id}).success(function(data){
					console.log(data);
				}).error(function(err){
					console.error(err);
				});
				
			}
		}
		
		/////////// END CONFIG CURRENCIES ///////////
		
		
		//////////// Language settings ////////////
		//to activate or deactivate a language
		$scope.lang_selected = "";
		
		$scope.language_list = [];
		
		$http.get('/config/listlanguages').success(function(data){
			$scope.language_list = data;
		}).error(function(err){
			console.error(err);
		});
		
		//list languages set as active
		$scope.list_languages = [];
		
		$scope.getActiveLanguages = function(){
			$http.get('/config/listActiveLanguages').success(function(data){
				$scope.list_languages = data;			
			}).error(function(error){
				console.error(error);
			});
		}
		$scope.getActiveLanguages();
		
		$scope.setLangActive = function(language){
			
			$http.post('/config/setActiveLanguage', {language: language}).success(function(data){
				console.log(data);
				$scope.getActiveLanguages();
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.setLangDefault = function(language){
			if ( language.by_default == 1 ){
				for ( i=0; i<$scope.language_list.length; i++ ){
					$scope.language_list[i].by_default = false;
				}
				language.by_default = true;
			
				$http.post('/config/setdefault', {id: language._id}).success(function(data){
					console.log(data);
				}).error(function(err){
					console.error(err);
				});
				
			}
		}
		
		$scope.showAddLangForm = false;
		// to toggle the display of the new lang form
		$scope.toggleAddLangForm = function(){
			$scope.showAddLangForm = ( $scope.showAddLangForm == false );
		}
		
		$scope.addLanguage = function(){
			$http.post('/config/add_language', { new_lang: $scope.newLanguage })
			.success(function(data){
				$scope.newLanguage = {};
				$scope.language_list.push(data);
				$scope.getActiveLanguages();
			}).error(function(err){
				console.error(err);
			});
		}
		
		//////////// End Language settings ////////////
		
		//////////// TAXES SETTINGS ///////////////////
		
		$scope.taxes_list = [];
		
		$scope.getTaxes = function(){
			$http.get('/config/listtaxes').success(function(data){
				$scope.taxes_list = data;
			}).error(function(err){
				console.error(err);
			});
		}
		$scope.getTaxes();
		
		$scope.showAddTaxForm = false;
		// to toggle the display of the new lang form
		$scope.toggleAddTaxForm = function(){
			$scope.showAddTaxForm = ( $scope.showAddTaxForm == false );
		}
		
		$scope.addTaxe = function(){
			$http.post('/config/add_taxe', { new_tax: $scope.newtax })
			.success(function(data){
				$scope.newtax = {};
				$scope.taxes_list.push(data);
				$scope.getTaxes();
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.setTaxeDefault = function(taxe){
			if ( taxe.by_default == 1 ){
				for ( i=0; i<$scope.taxes_list.length; i++ ){
					$scope.taxes_list[i].by_default = false;
				}
				taxe.by_default = true;
			
				$http.post('/config/settaxedefault', {id: taxe._id}).success(function(data){
					console.log(data);
				}).error(function(err){
					console.error(err);
				});
				
			}
		}
		
		$scope.setTaxeOnRooms = function(taxe){
			if ( taxe.on_rooms == 1 ){
				for ( i=0; i<$scope.taxes_list.length; i++ ){
					$scope.taxes_list[i].on_rooms = false;
				}
				taxe.on_rooms = true;
			
				$http.post('/config/settaxeonrooms', {id: taxe._id}).success(function(data){
					console.log(data);
				}).error(function(err){
					console.error(err);
				});
				
			}
		}

		
		//////////// END TAXES SETTINGS ///////////////////
		
		
		//////////UPLOAD MANAGEMENT/////////////
		    $scope.submitLogo = function() {
		       $scope.upload($scope.logoFile);
			};
		
		    // upload on file select or drop
		    $scope.upload = function (file) {
				$scope.load();
		        Upload.upload({
		            url: '/config/uploadLogo',
		            data: { fileUp: file }
		        }).then(function (resp) {
					$scope.validateAction(resp.config.data.fileUp.name + ' uploaded with success', 'success')
		            console.log('Success ' + resp.config.data.fileUp.name + 'uploaded. Response: ' + resp.data);
		        }, function (resp) {
		            console.log('Error status: ' + resp.status);
		        }, function (evt) {
		            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
		            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.fileUp.name);
		        });
		    };
		
		//////////END UPLOAD MANAGEMENT/////////////
		$scope.updateColors = function(){
			var linkscolor = angular.element( document.querySelector( '#linkscolor' ) ).val();
			$scope.load();
			$http.post('/config/update_links_color', { color : linkscolor })
			.success(function(data){
				$scope.validateAction(data, 'success');
			}).error(function(err){
				console.error(err);
				$scope.validateAction(err, 'error');
			});
		}
		
	}]);	
		

})();
