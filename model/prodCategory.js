var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var ProdSector = require('./prodSector');
var Language = require('./language');

var ObjectId = Schema.Types.ObjectId;

var categorySchema = new Schema({
	name: [{
		content: String,
		language: { type: ObjectId, ref: 'Language' },
	}],
	sector: { type: ObjectId, ref: 'ProdSector' },
	trashed: { type: Boolean, default: false },
});

categorySchema.statics.toTrash = function(id, callback){
	var cat = this;
	var Product = require('./produit');
	
	Product.where()
	.update({ category: id }, { $set: { trashed: true } }, { multi: true })
	.exec(function(err, prods){
		if (err) callback(err);
		else {
			console.log(prods);
			cat.findOneAndUpdate({_id: id}, { $set: { trashed: true } }, function(err, data){
				if (err) callback(err);
				else callback("", data)
			});
			
		}
	});
}


module.exports = db.model('ProdCategory', categorySchema);
