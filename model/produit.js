var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var ProdSector = require('./prodSector');
var ProdCategory = require('./prodCategory');
var Language = require('./language');
var Material = require('./material');


var ObjectId = Schema.Types.ObjectId;

var produitSchema = new Schema({
	name: [{
		content: String,
		language: { type: ObjectId, ref: 'Language' },
	}],
	price: Number,
	category: { type: ObjectId, ref: 'ProdCategory' },
	sector: { type: ObjectId, ref: 'ProdSector' },
	type: String,
	description: [{
		content: String,
		language: { type: ObjectId, ref: 'Language' },
	}],
	trashed: { type: Boolean, default: false },
	manage_stock: { type: Boolean, default: true },
	stock_type: { type: String, default: 'piece' }, //stock type define 'material' to activate stock management with ingredients
	contents: [{
		material: { type: ObjectId, ref: 'Material' },
		quantity: Number,
	}],
	stock: { type: Number, default: 0 },
	history: [{
		transaction: String,
		quantity: Number,
		date: { type: Date, default: Date() },
	}],
	
});

produitSchema.statics.toTrash = function(id, callback){
	
	this.findOneAndUpdate({_id: id}, { $set: { trashed: true } }, function(err, data){
		if (err) callback(err);
		else callback("", data)
	});
}

produitSchema.statics.cleanTrash = function(callback){
	this.remove({ trashed: true }, callback );
}

module.exports = db.model('Produit', produitSchema);




