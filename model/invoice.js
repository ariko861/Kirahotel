var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var Client = require('./client');
var Room = require('./room');
var Reservation = require('./reservation');


var ObjectId = Schema.Types.ObjectId;

var invoiceSchema = new Schema({
	client: { type: ObjectId, ref:'Client'},
	reservations: [{ type: ObjectId, ref:'Reservation'}],
	amount_paid: Number,
	subinvoices: [{type: ObjectId, ref:"SubInvoice"}],
	date: { type: Date, default: Date() },
	status: { type: String, default: "open" },
	total: Number,
	
	room: { type: ObjectId, ref:'Room'},
	
});


invoiceSchema.virtual('net').get(function () {
  total = this.total;
  if ( this.discount && this.discount.amount > 0 ){
	total -= this.discount.amount;
  }
  return total;
});

invoiceSchema.virtual('paid').get(function () {
  return ( this.amount_paid >= this.net ) ;
});

invoiceSchema.virtual('amount_due').get(function () {
  return (this.net - this.amount_paid) ;
});

invoiceSchema.set('toJSON', { virtuals: true });
/*
invoiceSchema.models.calculTotalPrice = function(){
	var total = 0;
	for ( i=0; i<this.reservations.length; i++){
		for ( j=0; j<this.reservations.tarifs.length; j++){
			var price = result.reservations.tarifs.price_per_night;
			for ( k=0; k<price.length; k++){
				if ( price[k].currency_code == code ){
					total += price[k].value;
				}
			}
		}
	}
}
/*
invoiceSchema.statics.calculTotalPrice = function(id, callback){
	var inv = this;
	inv.findOne({_id: id}, function(err, result){
		var total = 0;
		var code = result.currency_code;
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
module.exports = db.model('Invoice', invoiceSchema);

