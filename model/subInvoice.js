var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var Client = require('./client');
var Language = require('./language');
var ProdSector = require('./prodSector');
var Product = require('./produit');
var ObjectId = Schema.Types.ObjectId;

var subinvoiceSchema = new Schema({
	client: { type: ObjectId, ref:'Client'},
	items: [{
		designation: [{
			content: String,
			language: { type: ObjectId, ref: 'Language' },
		}],
		description: [{
			content: String,
			language: { type: ObjectId, ref: 'Language' },
		}],
		price: { type: Number },
		quantity: { type: Number },
		reference: { type: ObjectId, ref: 'Product' },
	}],
	sector: { type: ObjectId, ref: 'ProdSector' },
	id_number: String,
	amount_paid: { type: Number, default: 0 },
	discount: {
		amount: Number,
		percent: Number,
	},
	date: { type: Date, default: Date() },
	status: { type: String, default: "open" },
	total_price: Number,
	payment_way: String,
	
});

subinvoiceSchema.virtual('total').get(function () {
  var total = 0;
  for (i=0; i<this.items.length; i++){
	  total += this.items[i].price * this.items[i].quantity
  }
  return total;
});

subinvoiceSchema.virtual('net').get(function () {
  total = this.total;
  if ( this.discount && this.discount.amount > 0 ){
	total -= this.discount.amount;
  }
  return total;
});


subinvoiceSchema.virtual('paid').get(function () {
  return ( this.amount_paid >= this.net ) ;
});

subinvoiceSchema.virtual('amount_due').get(function () {
	if ( this.amount_paid ) {
		return (this.net - this.amount_paid) ;
	} else {
		return this.net;
	}
});

subinvoiceSchema.set('toJSON', { virtuals: true });

/*
invoiceSchema.statics.calculTotalPrice = function(id, callback){
	var inv = this;
	inv.findOne({_id: id}, function(err, result){
		var total = 0;
		for ( i=0; i<result.reservations.length; i++){
			for ( j=0; j<result.reservations.tarifs.length; j++){
				var price = result.reservations.tarifs.price_per_night;
				for ( k=0; k<price.length; k++){
					if ( price[k].currency_code == code ){
						total += price[k].value;
					}
				}
			}
		}		
	});
}
*/

module.exports = db.model('SubInvoice', subinvoiceSchema);


