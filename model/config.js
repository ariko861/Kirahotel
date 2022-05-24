var db = require('../lib/db')
var Schema = require('mongoose').Schema;

var configSchema = new Schema({
	option: { type: String, required: true, unique:true },
	value: { type: Boolean },
	valeur: { type: String },

});

module.exports = db.model('Config', configSchema);
