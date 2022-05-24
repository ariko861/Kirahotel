var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var Client = require('./client');
var Room = require('./room');
var Invoice = require('./invoice');
var Language = require('./language');

var ObjectId = Schema.Types.ObjectId;

var reservationSchema = new Schema({
	client: { type: ObjectId, ref:'Client'},
	client_name: String,
	room: { type: ObjectId, ref: 'Room' },
	begin: Date,
	end: Date,
	rates: [{
		begin: Date,
		end: Date,
		price: Number,
	}],
	arrival_time: {
		hours: Number,
		minutes: Number,
	},
	extra_costs: [{
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
	}],
	total_price: Number,
	amount_paid: { type: Number, default: 0 },
	discount: {
		amount: Number,
		percent: Number,
	},
	status: { type:String, default:'registered' },
});


reservationSchema.virtual('total').get(function () {
  var total = this.total_price;
  if ( this.extra_costs && this.extra_costs.length > 0 ) {
	  for (i=0; i<this.extra_costs.length; i++){
		  total += this.extra_costs[i].price * this.extra_costs[i].quantity
	  }
  }
  return total;
  
});

reservationSchema.virtual('net').get(function () {
  total = this.total;
  if ( this.discount && this.discount.amount > 0 ){
	total -= this.discount.amount;
  }
  return total;
});


reservationSchema.virtual('paid').get(function () {
	return ( this.amount_paid >= this.net );
});

reservationSchema.virtual('amount_due').get(function () {
	if ( this.amount_paid ) {
		return (this.net - this.amount_paid) ;
	} else {
		return this.net;
	}
});

reservationSchema.virtual('nights').get(function(){
	var one_day = 1000*60*60*24; //Get 1 day in milliseconds
	var res_length = Math.ceil( (this.end.getTime() - this.begin.getTime() ) / one_day);
	return res_length;
});





reservationSchema.set('toJSON', { virtuals: true });

reservationSchema.statics.listAll = function (callback) {
	this.find().populate('room').populate('client')
		.exec(function(err, resList){
		if (err) return console.error(err);
		callback("",resList);
	});
}

// check if there is another reservation than the one in the parameters
// within the dates beg and end, return true if there is other reservation, 
// else return false
reservationSchema.statics.checkIfOther = function(reservation, beg, end, callback){
	this.find({ 
		'_id': { $ne: reservation._id },
		'room': reservation.room._id,
		$or: [
			{ $and: [ { begin: { $gt: beg } }, { begin: { $lt: end } } ] },
			{ $and: [ { end: { $gt: beg } }, { end: { $lt: end } } ] },
			{ $and: [ { begin: { $lte: beg } }, { end: { $gte: end } } ] },
			]
		}, function(err, result){
			if (err) callback(err);
			else {
				if (result.length > 0) callback("", true);
				else callback("", false);
			}
	});
}



reservationSchema.statics.calculTotal = function (id, callback) {
}

reservationSchema.statics.checkIn = function (id, callback) {
	this.findOne({ '_id': id })
		.populate('client').populate('room')
		.exec(function(err, reservation){
			if (err) callback(err);
			else {
				if ( reservation.room.occupied ) {
					callback('',"occupied");
				} else {
					reservation.status = "checkedin";
					reservation.room.occupied = true;
					reservation.room.save(function(err, room){
						if (err) callback(err);
						else {
							reservation.save(function(err, reservationToDate){
								if (err) callback(err);
								else res.json(reservationToDate);
									
							});
						}
					});
				}
			}			
			
		});

}

reservationSchema.statics.checkIfClientCheckIn = function(client_id, callback){
	this.find({ client: client_id, status: 'checkedin' }, function(err, reservations){
		if (err) callback(err);
		else {
			if (reservations.length > 0){
				callback('', true);
			} else {
				callback('', false);
			}
		}
	});
	
	
}


module.exports = db.model('Reservation', reservationSchema);
