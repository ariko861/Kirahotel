var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var ProdSector = require('./prodSector');
var Language = require('./language');

var ObjectId = Schema.Types.ObjectId;

var materialSchema = new Schema({
	name: [{
		content: String,
		language: { type: ObjectId, ref: 'Language' },
	}],
	stock: { type: Number, default: 0 },
	unit: String,
	sector: { type: ObjectId, ref: 'ProdSector' },
	trashed: { type: Boolean, default: false },
	
	history: [{
		transaction: String,
		quantity: Number,
		date: { type: Date, default: Date() },
	}],
});

module.exports = db.model('Material', materialSchema);





