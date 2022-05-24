(function(){

	var app = angular.module('monitor', ['settings', 'ngHtmlCompile', 'kira_tools', 'i18n']);
	
	app.service('config', function(settings) {
		this.USER = settings.USER;
		this.CURRENCIES = settings.CURRENCIES;
		this.SECTORS = settings.SECTORS;
		this.DEF_CURRENCY = settings.DEF_CURRENCY;
		this.LANGUAGES = settings.LANGUAGES;
		this.DEF_LANGUAGE = settings.DEF_LANGUAGE;
		this.LIST_USERNAMES = settings.LIST_USERNAMES;
	});

	app.controller('MonitorController', [ '$scope', '$http', 'config', '$timeout', '$window', 'i18n', function($scope, $http, config, $timeout, $window, i18n){
		
		
		$scope.i18n = i18n;
		$scope.trans = {};
		$scope.trans.notif_text = i18n.__("A new user action require attention !");
		
		i18n.ensureLocaleIsLoaded().then( function() {
			$scope.trans.notif_text = i18n.__("A new user action require attention !");
		});

		/////////////To list all useful parameters, languages, user infos... ///////
		
		// to get user informations
		$scope.session = {};
		config.USER.success(function(data){
			$scope.session = data;
		}).error(function(err){
			console.error(err);
		});
		
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
		
		$scope.logs = [];
		
		$scope.fetchLogs = function(){
			$http.get('/fetch_logs').success(function(data){
				$scope.logs = data;
			}).error(function(err){
				console.error(err);
			});	
		}
		
		$scope.fetchLogs();
		
		$scope.levels = [ 0, 1, 2, 3, 4, 5 ];
		
		$scope.logFilter = function(log){
			if (!$scope.level_filter) return true;
			else if ( log.level >= $scope.level_filter ) return true;
			else return false;
			
		}
		
		$scope.notif = function(text){
			if (!("Notification" in window)) {
		    alert("This browser does not support desktop notification");
		  }
		
		  // Let's check whether notification permissions have already been granted
		  else if (Notification.permission === "granted") {
		    // If it's okay let's create a notification
		    var notification = new Notification(text);
		  }
		
		  // Otherwise, we need to ask the user for permission
		  else if (Notification.permission !== 'denied') {
		    Notification.requestPermission(function (permission) {
		      // If the user accepts, let's create a notification
		      if (permission === "granted") {
		        var notification = new Notification(text);
		      }
		    });
		  }
		}
		
		//////// SOCKETS.IO ///////////
		
		var socket = io();
		
		socket.on('logs', function(data){
			$scope.$apply(function(){
				$scope.logs.push(data);
				if ( data.level >= 5 ){
					$scope.notif($scope.trans.notif_text + '\n'+data.user.username +' '+data.translated_action);
				}
			});
		});

	}]);
	
	
})();
