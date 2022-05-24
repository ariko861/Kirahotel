var db = require('../lib/db')
var Schema = require('mongoose').Schema;

var priceSchema = new Schema({
	value: Number,
	currency_code: String,
});

module.exports = db.model('Price', priceSchema);
