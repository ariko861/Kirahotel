var db = require('../lib/db')
var Schema = require('mongoose').Schema;


var ratesSchema = new Schema({
	name: String,
	price: Number,
	begin: Date,
	end: Date,
});


module.exports = db.model('Rates', ratesSchema);
