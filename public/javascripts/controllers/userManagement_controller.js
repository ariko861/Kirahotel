(function(){

	var app = angular.module('userManagement', ['ngHtmlCompile', 'settings']);
	
	app.service('configuration', function(settings) {
		this.USER = settings.USER;
		this.SECTORS = settings.SECTORS;
	});
	
	app.controller('UsersManagementController', [ '$scope', '$http', '$timeout', 'configuration', function($scope, $http, $timeout, configuration){
		
		/* TO COPY for display of notifications */
		// initialization of variables for notifications
		$scope.loading = false;
		$scope.validated = false;
		$scope.successmessage = "";
		$scope.statutmessage = '';
		$scope.session = {};
		
		configuration.USER.success(function(data){
			$scope.session = data;
		}).error(function(err){
			console.error(err);
		});
		
		
		// to get the list of sectors
		$scope.list_sectors = [];
		configuration.SECTORS.success(function(data){
			$scope.list_sectors = data;
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
		/* END COPY for display of notifications */
		
		/* TO COPY for deletion permissions */
		// initialization of variables for deletion
		$scope.deletion_allowed = false;
		//function to check if deletion allowed
		$scope.canDelete = function(bool){
			return $scope.deletion_allowed === bool;
		}
		//function to set deletion permit
		$scope.setAllowDelete = function(bool){
			$scope.deletion_allowed = bool;
		}
		/* END COPY for deletion permissions */
		
		/* TO COPY for change permissions */
		
		$scope.changes_allowed = false;
		//function to check if changes are allowed
		$scope.canChange = function(bool){
			return $scope.changes_allowed === bool;
		}
		//function to set deletion permit
		$scope.$watch('changes_allowed', function(newValue, oldValue){
			if ( newValue === true ){
				$scope.groupFieldHTML = "<select class='form-control' ng-model='userGroup[user._id]' ng-init='userGroup[user._id] = user.group._id' ng-options='group._id as group.name for group in groups_list'></select><button class='btn btn-default' ng-click='changeUserGroup(user._id)'>Save changes</button>";
				$scope.languageFieldHTML = "<select class='form-control' ng-model='userLang[user._id]' ng-init='userLang[user._id] = user.language._id' ng-options='language._id as language.translated_name for language in list_languages'></select><button class='btn btn-default' ng-click='changeUserLanguage(user._id)'>Save changes</button>";
			} else if ( newValue === false ){
				$scope.groupFieldHTML = "{{user.group.name}}";
				$scope.languageFieldHTML = "{{user.language.translated_name}}";
			}
		});
		/*$scope.setAllowChange = function(bool){
			$scope.changes_allowed = bool;
			if (bool === true){
				$scope.groupFieldHTML = "<select ng-model='userGroup[user._id]' ng-init='userGroup[user._id] = user.group._id' ng-options='group._id as group.name for group in groups_list'></select><button ng-click='changeUserGroup(user._id)'>Save changes</button>";
				$scope.languageFieldHTML = "<select ng-model='userLang[user._id]' ng-init='userLang[user._id] = user.language._id' ng-options='language._id as language.translated_name for language in list_languages'></select><button ng-click='changeUserLanguage(user._id)'>Save changes</button>";
				
			} else if (bool === false){
				$scope.groupFieldHTML = "{{user.group.name}}";
				$scope.languageFieldHTML = "{{user.language.translated_name}}";
			}
		}*/
		
		/* END COPY for change permissions */
		
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
		
		//to display multi-language content in one language
		$scope.displayContent = function(content){
			if ($scope.session.language){// if there is a user defined
				for (i=0; i<content.length; i++){// first check if user language is in content
					if ( content[i].language == $scope.session.language._id && content[i].content ){
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
		//function to manage order in the reservation table
		$scope.predicate = 'begin';
		$scope.reverse = true;
		$scope.order = function(predicate) {
			$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
			$scope.predicate = predicate;
		};
		
		//initialization of variables for notifications
		
		
		$scope.users_list = [];
		$scope.newUser = {};
		$scope.showFormAddUser = false;
		$scope.rights_list = [];
			
		
		$scope.groups_list = [];
		$scope.newGroup = {};
		$scope.userGroup = {};
		$scope.showFormAddGroup = false;
		
		$scope.userLang = {};
		
		$scope.rightToAdd = [];
		$scope.rightToDel = [];
		$scope.groupFieldHTML = "{{user.group.name}}";
		$scope.languageFieldHTML = "{{user.language.translated_name}}";
		
		// update the list of users
		$scope.updateUsers = function(){
			$http.get('/users/list').success(function(data){
				$scope.users_list = data;
				
			}).error(function(err){
				console.error(err);
			});
			
		}
		//function cancel display of new user form 
		$scope.cancelAddUser = function(){
			$scope.showFormAddUser = false;
			$scope.newUser = {};
		}
		
		//function to create new user
		$scope.submitUser = function(){
			$scope.loading = true;
			$http.post('/users/add', {new_user: $scope.newUser}).
				success(function(data){
					$scope.validateAction(data, 'success');
					$scope.updateUsers()
					$scope.cancelAddUser();
				}).
				error(function(error){
					$scope.validateAction(error, 'error');
					console.error(error);
				});
		}
		
		//function to list rights accessible
		$scope.getRightsList = function(){
			$http.get('/users/get_rights_list').success(function(data){
				$scope.rights_list = data;
			}).error(function(err){
				console.log(err);
			});
		}	
		
		//function to delete user
		$scope.deleteUser = function(id){
			$scope.loading = true;
			$http.post('/users/delete', {user_id : id}).success(function(data){
				$scope.updateUsers();
				$scope.validateAction(data, 'success');
			}).error(function(err){
				console.error(err);
				$scope.validateAction(err, 'error');
			});
			
		}
		
		//function to change user group
		$scope.changeUserGroup = function(id){
			$scope.loading = true;
			$http.post('/users/changegroup', {user_id: id, group_id:$scope.userGroup[id] }).success(function(data){
				$scope.updateUsers();
				$scope.userGroup = {};
				$scope.validateAction(data, 'success');
			}).error(function(err){
				console.err(err);
				$scope.validateAction(err, 'error');
			});
			
		}
		
		//function to change user language
		$scope.changeUserLanguage = function(id){
			$scope.loading = true;
			$http.post('/users/changelanguage', {user_id: id, lang_id:$scope.userLang[id] }).success(function(data){
				$scope.updateUsers();
				$scope.userLang = {};
				$scope.validateAction(data, 'success');
			}).error(function(err){
				console.err(err);
				$scope.validateAction(err, 'error');
			});
			
		}
		
		// update the list of groups
		$scope.updateGroups = function(){
			$http.get('/users/list_groups').success(function(data){
				$scope.groups_list = data;
			}).error(function(err){
				console.error(err);
			});
			
		}
		//function cancel display of new group form 
		$scope.cancelAddGroup = function(){
			$scope.showFormAddGroup = false;
			$scope.newGroup = {};
		}
		
		//function to create new group
		$scope.submitGroup = function(){
			$scope.loading = true;
			$http.post('/users/addgroup', {new_group: $scope.newGroup}).
				success(function(data){
					$scope.validateAction(data, 'success');
					$scope.cancelAddGroup();
					$scope.updateGroups();
				}).
				error(function(error){
					$scope.validateAction(error, 'error');
					console.error(error);
				});
		}
		

		
		//function to add rights
		$scope.addRights = function(group){
			var rights = $scope.rights_list
			var newRights = {};
			for (i=0 ; i < rights.length ; i++){
				if ( $scope.rightToAdd[group._id].indexOf( rights[i].right ) >= 0 ){
					newRights[rights[i].right] = true
				} else {
					newRights[rights[i].right] = group[rights[i].right];
				}
			}
			
			$http.post('/users/change_rights', {group_id: group._id, new_rights: newRights}).success(function(data){
				$scope.validateAction(data, 'success');
				$scope.updateGroups();
				$scope.rightToAdd[group._id] = []
			}).error(function(err){
				$scope.validateAction(error, 'error');
				console.error(error);
			});
			
		}
		
		//function to double the span of the table in groups if manage sectors
		$scope.doubleSpan = function(expression){
			if (expression) return 1;
			else return 2;
		}
		
		//function to delete rights
		$scope.delRights = function(group){
			var rights = $scope.rights_list
			var newRights = {};
			for (i=0 ; i < rights.length ; i++){
				if ( $scope.rightToDel[group._id].indexOf( rights[i].right ) >= 0 ){
					newRights[rights[i].right] = false
				} else {
					newRights[rights[i].right] = group[rights[i].right];
				}
			}
			
			$http.post('/users/change_rights', {group_id: group._id, new_rights: newRights}).success(function(data){
				$scope.validateAction(data, 'success');
				$scope.updateGroups();
				$scope.rightToDel[group._id] = []
			}).error(function(err){
				$scope.validateAction(error, 'error');
				console.error(error);
			});
			
		}
		
		/////////////////sectors management//////////////////////////
		
		$scope.removeAccessSector = function(group, sector){
			
			$http.post('/users/removesectoraccess', {group: group, sector_id: sector._id})
			.success(function(data){
				group.allowed_sectors = data.allowed_sectors;
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		
		$scope.addSectorToRights = function(group){
			$http.post('/users/addsectoraccess', {group: group}).success(function(data){
				group.allowed_sectors = data.allowed_sectors;
			}).error(function(err){
				console.error(err);
			});
			
		}
		
		$scope.hassectorright = function(group, sector){
			for (i=0; i<group.allowed_sectors.length; i++){
				if ( sector._id == group.allowed_sectors[i]._id ){
					return true;
				}
			}
			return false;
			
		}
		/////////////////end of sectors management//////////////////////////
		
		$scope.getRightsList();
		$scope.updateUsers();
		$scope.updateGroups();
		
		
	}]);
	
	app.directive('nxEqualEx', function() {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, model) {
            if (!attrs.nxEqualEx) {
                console.error('nxEqualEx expects a model as an argument!');
                return;
            }
            scope.$watch(attrs.nxEqualEx, function (value) {
                // Only compare values if the second ctrl has a value.
                if (model.$viewValue !== undefined && model.$viewValue !== '') {
                    model.$setValidity('nxEqualEx', value === model.$viewValue);
                }
            });
            model.$parsers.push(function (value) {
                // Mute the nxEqual error if the second ctrl is empty.
                if (value === undefined || value === '') {
                    model.$setValidity('nxEqualEx', true);
                    return value;
                }
                var isValid = value === scope.$eval(attrs.nxEqualEx);
                model.$setValidity('nxEqualEx', isValid);
                return isValid ? value : undefined;
            });
        }
    };
});

})();
