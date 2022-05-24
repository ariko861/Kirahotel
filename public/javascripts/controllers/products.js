(function(){

	var app = angular.module('products', ['settings', 'ngHtmlCompile', 'i18n']);
	
	app.service('config', function(settings) {
		this.USER = settings.USER;
		this.CURRENCIES = settings.CURRENCIES;
		this.SECTORS = settings.SECTORS;
	});
	
	app.controller('ProductsController', [ '$scope', '$http', 'config', '$timeout', '$window', 'i18n', function($scope, $http, config, $timeout, $window, i18n){
		
		///////// Get translations
		
		$scope.i18n = i18n;
		$scope.trans = {};
		$scope.trans.confirm = i18n.__("Confirm");
		$scope.trans.delete_category_content = i18n.__("Are you sure you want to delete this category and all its content ?");

		i18n.ensureLocaleIsLoaded().then( function() {
			$scope.trans.confirm = i18n.__("Confirm");
			$scope.trans.delete_category_content = i18n.__("Are you sure you want to delete this category and all its content ?");				
		});
	
		
		$scope.sector_list = [];
		$scope.list_categories = [];
		$scope.list_products = [];
		
		$scope.sector_actif = "";
		$scope.active_category = "";
		
		
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
		
		//list currencies set as active
		$scope.list_currencies = [];
		
		$http.get('/config/listActiveCurrencies').success(function(data){
			$scope.list_currencies = data;			
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
		
		//list languages set as active
		$scope.list_languages = [];
		
		$http.get('/config/listActiveLanguages').success(function(data){
			$scope.list_languages = data;
		}).error(function(error){
			console.error(error);
		});
		
		// get default_language
		$scope.default_language = {};
		$http.get('/config/defaultLanguage').success(function(data){
			$scope.default_language = data;
		}).error(function(err){
			console.error(err);
		});
		
		$scope.session = {};
		config.USER.success(function(data){
			$scope.session = data;
		}).error(function(err){
			console.error(err);
		});
		
		config.SECTORS.success(function(data){
			$scope.sector_list = data;
		}).error(function(err){
			console.error(err);
		});
		
		$scope.updateProducts = function() {
			$http.get('/products/list').success(function(data){
				$scope.list_products = data;
			}).error(function(err){
				console.error(err);
			});
		}
		$scope.updateProducts();
		
		$scope.updateCategories = function() {
			$http.get('/products/categorylist').success(function(data){
				$scope.list_categories = data;
			}).error(function(err){
				console.error(err);
			});
		}
		$scope.updateCategories();
		
		$scope.updateMaterials = function() {
			$http.get('/products/materialslist').success(function(data){
				$scope.list_materials = data;
			}).error(function(err){
				console.error(err);
			});
		}
		$scope.updateMaterials()
		
		//to display multi-language content in one language
		$scope.displayContent = function(content){
			if (content){
				if ($scope.session.user_language){// if there is a user defined
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
		//////// category form /////////////
		$scope.newcategory = {};
		
		$scope.addCategory = function(){
			$scope.newcategory.sector = $scope.sector_actif;
			var newcategory = $scope.newcategory;
			newcategory.name = [];
			var languages = $scope.list_languages;
			//pass from arrays to array of dictionnaries names and descriptions
			for ( i=0; i<languages.length; i++){
				var lang = languages[i]._id;
				var singlename = {
					content: newcategory.names[lang],
					language: lang,
				}
				newcategory.name.push(singlename)				
			}
			$http.post('/products/addcategory', { new_cat: newcategory })
			.success(function(data){
				$scope.list_categories.push(data);
				$scope.cancelAddCategory();
			}).error(function(err){
				console.error(err);
			});
			
		}
		$scope.cancelAddCategory = function(){
			$scope.showCategoryForm = false;
			$scope.newcategory = {};
		}
		
		//////// end category form /////////////
		
		
		//////// product form /////////////
		$scope.newproduct = {};
		$scope.newproduct.contents = [];
		
		//function to add a new product from addProdForm
		$scope.addProduct = function(){
			$scope.newproduct.sector = $scope.sector_actif;
			$scope.newproduct.category = $scope.active_category;
			var newproduct = $scope.newproduct;
			newproduct.name = [];
			newproduct.description = [];
			var languages = $scope.list_languages;
			//pass from arrays to array of dictionnaries names and descriptions
			for ( i=0; i<languages.length; i++){
				var lang = languages[i]._id;
				var singlename = {
					content: newproduct.names[lang],
					language: lang,
				}
				newproduct.name.push(singlename)
				
				if (newproduct.descriptions){
					var singledescription = {
						content: newproduct.descriptions[lang],
						language: lang,
					}
					newproduct.description.push(singledescription)
				}
			}
			$http.post('/products/addproduct', { new_prod: newproduct })
			.success(function(data){
				$scope.list_products.push(data);
				$scope.cancelAddProd();
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		//function to cancel add product form	
		$scope.cancelAddProd = function(){
			$scope.showProdForm = false;
			$scope.newproduct = {};
			$scope.newproduct.contents = [];
			$scope.prodInfo = false;
			$scope.prodModDisable = false;
		}
		
		//////// end product form /////////////

		
		$scope.setActive = function(sector){
			$scope.sector_actif = sector;
			$scope.active_category = "";
		}
		
		$scope.setActiveCat = function(category){
			$scope.active_category = category._id;
		}
		
		// function to check if user can access this sector
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
		
		
		//function to ask confirmation for category delete
		$scope.askCatDelete = function(id){
			$scope.popupAction = "<button ng-click='deleteCategory("+'"'+id+'"'+")'>"+ $scope.trans.confirm +"</button>";
			$scope.superpopup_message = $scope.trans.delete_category_content;
			$scope.show_super_popup = true;
		}
		
		//function to delete category
		$scope.deleteCategory = function(id){
			$scope.notif_statut = "loading";
			$http.post('/products/deletecategory', {id: id}).success(function(data){
				$scope.validateAction(data, 'success');
				$scope.updateCategories();
				$scope.cancelSuperPopup();
			}).error(function(err){
				console.error(err);
				$scope.validateAction(err, 'error');
			});
		}
		
		//function to delete product
		$scope.deleteProduct = function(id){
			$scope.notif_statut = "loading";
			$http.post('/products/deleteproduct', {id: id}).success(function(data){
				$scope.validateAction(data, 'success');
				$scope.updateProducts();
			}).error(function(err){
				console.error(err);
				$scope.validateAction(err, 'error');
			});
		}
		
		$scope.showPriceList = function(){
			$scope.show_form_menu = true;
			$scope.formMenu = {};
			$scope.formMenu.sector = $scope.sector_actif;
		}
		
		$scope.cancelPrint = function(){
			$scope.show_form_menu = false;
			$scope.formMenu = {};
		}
		
		$scope.printPriceList = function(){
			var params = $scope.formMenu;
			$window.open('/products/print_price_list/' + params.sector._id + '/' + params.language + '/' + params.currency);
			/*
			$http.post('/products/print_price_list', { formMenu: $scope.formMenu })
			.success(function(data){
				$window.open(data);
			}).error(function(err){
				console.error(err);
			});*/
		}
		
		$scope.startNewMaterial = function(){
			$scope.newmaterial = {};
			$scope.showMaterialForm = true;
			$scope.newProdContent = {};
		}
		
		$scope.cancelAddMaterial = function(){
			$scope.newmaterial = {};
			$scope.showMaterialForm = false;
			$scope.newProdContent = {};
		}

		
		//function to add a new material from addMaterialForm
		$scope.addMaterial = function(){
			$scope.newmaterial.sector = $scope.sector_actif;
			var newmaterial = $scope.newmaterial;
			newmaterial.name = [];
			var languages = $scope.list_languages;
			//pass from arrays to array of dictionnaries names
			for ( i=0; i<languages.length; i++){
				var lang = languages[i]._id;
				var singlename = {
					content: newmaterial.names[lang],
					language: lang,
				}
				newmaterial.name.push(singlename)
			}
			$http.post('/products/add_material', { new_material: newmaterial })
			.success(function(data){
				$scope.list_materials.push(data);
				$scope.cancelAddMaterial();
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		$scope.addIngredient = function(){
			var newMat = $scope.newProdContent;
			$scope.newproduct.contents.push(newMat);
			$scope.newProdContent = {};
			
		}
		$scope.removeContent = function(content){
			var index = $scope.newproduct.contents.indexOf(content);
			$scope.newproduct.contents.splice(index, 1);
			
		}
		
		$scope.materialInActiveSector = function(material){
			return material.sector === $scope.sector_actif._id;
		}
		
		$scope.selectProd = function(product){
			$scope.showProdForm = true;
			$scope.prodInfo = true;
			$scope.prodModDisable = ( !$scope.changes_allowed );
			product.names = [];
			product.descriptions = [];
			
			var languages = $scope.list_languages;
			//pass from arrays to array of dictionnaries names and descriptions
			for ( i=0; i<languages.length; i++){
				var lang = languages[i]._id;
				var index = getlangindict(product.name, lang);
				if ( index >= 0 ){
					product.names[lang] = product.name[index].content;
				}
				if ( product.description && product.description.length > 0 ){
					
					var desindex = getlangindict(product.description, lang);
					
					if ( desindex >= 0 ){
						product.descriptions[lang] = product.description[desindex].content;
					}
				}
			}
			$scope.newproduct = product;
		}
		
				//function to add a new product from addProdForm
		$scope.saveProdModifs = function(){
			var product = $scope.newproduct;
			product.name = [];
			product.description = [];
			var languages = $scope.list_languages;
			//pass from arrays to array of dictionnaries names and descriptions
			for ( i=0; i<languages.length; i++){
				var lang = languages[i]._id;
				var singlename = {
					content: product.names[lang],
					language: lang,
				}
				product.name.push(singlename)
				
				if (product.descriptions){
					var singledescription = {
						content: product.descriptions[lang],
						language: lang,
					}
					product.description.push(singledescription)
				}
			}
			$http.post('/products/change_product', { prod: product })
			.success(function(data){
				$scope.updateProducts();
				$scope.cancelAddProd();
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		$scope.updateProdStock = function(product){
			$http.post('/products/update_stock', { product: product })
			.success(function(data){
				product.stock = data.stock;
				product.stockToAdd = 0;
				product.show_options = false;
			}).error(function(err){
				console.error(err);
			});			
		}
		
		$scope.updateMaterialStock = function(material){
			$http.post('/products/update_stock_material', { material: material })
			.success(function(data){
				material.stock = data.stock;
				material.stockToAdd = 0;
				material.show_options = false;
			}).error(function(err){
				console.error(err);
			});			
		}


	}]);

var getlangindict = function(dict, val){
	for (i=0;i<dict.length;i++){
		if (dict[i].language == val){
			return i;
		}
	}
}

})();
