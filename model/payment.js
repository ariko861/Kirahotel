var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var Invoice = require('./invoice');
var SubInvoice = require('./subInvoice');

var ObjectId = Schema.Types.ObjectId;

var paymentSchema = new Schema({
	amount: Number,
	way: String,
	date: { type: Date, default: Date() },
	reference: [{
		invoice_type: String,
		invoice_ref: ObjectId,
	}],
	user: String,
});

module.exports = db.model('Payment', paymentSchema);

