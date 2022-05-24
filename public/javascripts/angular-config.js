angular.module('settings', [])
    .factory('settings', ['$http', function($http) {
        var user_infos = {};
        var currency_list = [];
        var sector_list = [];
        
        user_infos = $http.get('/user_infos' );
        currency_list = $http.get('/config/listActiveCurrencies');
        sector_list = $http.get('/products/sectorlist');
        default_currency = $http.get('/config/defaultCurrency');
        active_languages = $http.get('/config/listActiveLanguages');
        default_language = $http.get('/config/defaultLanguage');
        usernames_list = $http.get('users/list_usernames');
        
        return {
            USER: user_infos,
            CURRENCIES: currency_list,
            SECTORS: sector_list,
            DEF_CURRENCY: default_currency,
            LANGUAGES: active_languages,
            DEF_LANGUAGE: default_language,
            LIST_USERNAMES: usernames_list,
        };
    }]);
