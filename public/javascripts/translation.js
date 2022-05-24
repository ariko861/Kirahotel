(function(){

	var app = angular.module('translate-i18n', ['i18n']);
	
	app.controller('Translate', [ '$scope', 'i18n', '$http', function( $scope, i18n, $http ) {
		
		//Manage all translations for the application
		//////////////// Translation Part ///////////////////
		
		$scope.i18n = i18n;
		$scope.trans = {};
		
		
		i18n.ensureLocaleIsLoaded().then( function() {
			// Chaining on the promise returned from ensureLocaleIsLoaded() will make sure the translation is loaded.
		
		} );
		
		//////////////////// End of translations /////////////////
		
		////////////////// Configurations /////////////////
			
		$scope.menu_selected = 'H';
		
		$scope.translations = {};
		$scope.locale = 'fr';
		
		$scope.actualizeLocale = function(locale, callback){
			$http.get('/mergelocale/'+ locale ).success(function(){
				callback(locale);
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.getLocaleTranslations = function(locale){
			$http.get('/i18ntranslate/json/' + locale ).success(function(data){
				$scope.translations = data;
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.updateLocale = function(locale){
			$http.post('/i18ntranslate/update/'+locale, { translations: $scope.translations})
			.success(function(data){
				alert(data)
			}).error(function(err){
				console.error(err);
			});
		}
		
		$scope.actualizeLocale($scope.locale , $scope.getLocaleTranslations);
		
		
		
	}]);
	

})();



