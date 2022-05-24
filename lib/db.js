var mongoose = require('mongoose');
var c = require('../config.js')

if ( c.mongo_custom_port ){
	var port = ':' + c.mongo_custom_port;
} else {
	var port = ''
}

if ( c.mongo_auth ){
	var uri = 'mongodb://' + c.mongo_user + ':' + c.mongo_password + '@' + c.mongo_host + port + '/' + c.mongo_db;
} else {
	var uri = 'mongodb://'+ c.mongo_host + port + '/'+ c.mongo_db;
}

module.exports = mongoose.createConnection(uri);

