var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var mongoose = require('mongoose');
var findIndexByKeyValue = require('../model/listFunctions').findIndexByKeyValue;
var catchError = require('../lib/catcherror');
var checkRights = require('../lib/rights');
var createLog = require('../lib/recordlogs');
var Room = require('../model/room');
var Reservation = require('../model/reservation');
var Client = require('../model/client');
var Currency = require('../model/currency');
var Language = require('../model/language');
var Payment = require('../model/payment');
var SubInvoice = require('../model/subInvoice');
var Taxe = require('../model/taxe');


function mix(source, target) {
 for(var key in source) {
 if (source.hasOwnProperty(key)) {
 target[key] = source[key];
 }
 }

}

var listReservations = function(callback){
	Reservation.find(function(err, resList){
		if (err) return console.error(err);
		callback("",resList);
	});
}

var listActiveCurrencies = function(callback){
	Currency.find({active: true}).sort('code').exec(function(err, list) {
		if (err) return callback(err);
		else callback("",list);
		
	});
}

var checkIfReservation = function(room_id, beggie, endie, callback){
	var beg = new Date(beggie.setHours(13,0,0,0))
	var end = new Date(endie.setHours(10,0,0,0))
	
	Reservation.find({ room: room_id,
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

var calculReservation = function(newRes, callback){
	Room.findOne({'_id': newRes.room }).populate('rates').exec(function(err, resRoom){
		if (err) return console.error(err);
		var stay_length = newRes.nights;
		var result = 0;
		var j = 0;
		var res_rates = [];
		for (d = 0 ; d < stay_length ; d++){ // for each day of the reservation period
			day = new Date(newRes.begin.getTime() + d*24*60*60*1000) // we select the day after 'd' days the beginning of reservation
			var has_rate = false;
			for (i = 0 ; ( i < resRoom.rates.length ) && ( has_rate == false ) ; i++){ //for each special rate applied to the room
				if ( (resRoom.rates[i].begin <= day) && (day <= resRoom.rates[i].end) ) { // if the room has special rate for the selected day
					result += resRoom.rates[i].price;
					has_rate = true;
					if ( !res_rates[j] ){
						res_rates[j] = {};
						res_rates[j].begin = new Date( day );
						res_rates[j].price = resRoom.rates[i].price;
					} else if (resRoom.rates[i].price !== res_rates[j].price) {
						res_rates[j].end = new Date( day );
						j++;
						res_rates[j] = {};
						res_rates[j].begin = new Date( day );
						res_rates[j].price = resRoom.rates[i].price;
					}
				}
			}
			if ( has_rate === false ) { // if there was no special rate in the selected day
				result += resRoom.default_price;
				if (res_rates[j] && res_rates[j].begin && !res_rates[j].end){
					res_rates[j].end = new Date( day );
					j++;
				}
			}
		}
		callback("", { total: result, rates: res_rates });
	
	});
	
}

var calculRoomPrice = function(room_id, beg, end, callback){
	var res = {};
	res.room = room_id;
	res.begin = beg;
	res.end = end;
	res.nights = (end - beg)/(24*60*60*1000);
	calculReservation(res, callback);

	
}

/*
router.get('/test/:id', function(req, res, next) {
	res_id = req.params.id;
	Reservation.findOne({'_id':res_id}, function(err, res){
		if (err) return console.error(err);
		calculReservation(res, function(err, result){
			if (err) return console.error(err);
			console.log(result);
		});
	});
});
*/

router.get('/', checkRights('reservation_can_read_info'), function(req, res, next) {
	res.render('reservations', { title: i18n.__('Reservations management')});

});

router.get('/list', checkRights('reservation_can_read_info'), function(req, res, next){
	Reservation.listAll(function(err, resList) {
		res.json(resList);
	});
});

router.post('/list_reservations', checkRights('reservation_can_read_info'), function(req, res, next){
	var beg = new Date(req.body.period.begin);
	var ed = new Date(req.body.period.end);
	var begin = new Date( beg.setHours(0,0,0,0) );
	var end = new Date( ed.setHours(23,59,59,999) );
	Reservation.find({
		$or: [
			{ $and : [ { begin: { $gte: begin } }, { begin: { $lte: end } } ] },
			{ $and : [ { end: { $gte: begin } }, { end: { $lte: end } } ] },
		]
		}).populate('client room').exec(function(err, reservations){
			if (err) catchError(err);
			else res.json(reservations);
		}
	);
	
	
});

router.post('/get_client_reservations', checkRights('reservation_can_read_info'), function(req, res, next){
	var client_id = req.body.client_id;
	Reservation.find({ client: client_id, status: 'checkedin' }).populate('room').exec(function(err, reservations){
		if (err) catchError(err);
		else res.json(reservations);
	});
});

router.post('/add', checkRights('reservation_can_add'), function(req, res, next){
	begie = new Date(req.body.begin_date);
	endie = new Date(req.body.end_date);
	beg = new Date( begie.setHours(14,0,0,0) );
	end = new Date( endie.setHours(10,0,0,0) );
	new_reservation = req.body.newReservation;
	checkIfReservation(new_reservation.room._id, beg, end, function(err, has_res){
		if (err) return catchError(err);
		
		if (has_res) {
			var text_error = "Error : " + "There is already a reservation in these dates"
			res.end(text_error);
		} else {
			var newObjet = new Reservation({
					client: new_reservation.client,
					room: new_reservation.room._id,
					begin: beg,
					end: end,
					arrival_time: new_reservation.arrival_time,
				});
			Client.findOne({'_id': mongoose.Types.ObjectId(new_reservation.client)}, function(err, client){
				if (err) return console.error(err);
				newObjet.client_name = client.first_name.charAt(0) + '. ' + client.last_name;
				calculReservation(newObjet, function(err, result){
				  if (err) return console.error(err);
				  else {
					  newObjet.total_price = result.total;
					  newObjet.rates = result.rates;
					  newObjet.save(function (err, objet) {
						  if (err) return console.error(err);
						  var text_confirmation = "new " + objet + " created";
						  res.end(text_confirmation);
						  createLog( 'add new reservation', 3, req);
					  });
				  }
				});
			});
		}
	});
});

// get reservation info with _id = res_id
router.get('/info/:res_id', checkRights('reservation_can_read_info'), function(req, res, next){
	Reservation.findOne({'_id': req.params.res_id})
	.populate('client').populate('room')
	.exec(function(err, reservation){
		if (err) return console.error(err);
		res.json(reservation);
		
	});
});

// to delete reservation
router.post('/delete', checkRights('reservation_can_delete'), function(req, res, next){
	
	Reservation.remove({'_id': mongoose.Types.ObjectId(req.body.reservation_id)}, function(err){
		if (err) return console.error(err);
		var reservation_deleted = "The reservation number " + req.body.reservation_id + " was deleted";
		console.log(reservation_deleted);
		res.end(reservation_deleted);
		createLog( 'delete reservation', 5, req);
	});
	
});

// get reservations for one room from dateBegin to dateEnd
router.get('/get_reservations_for_room/:room_id/:dateBegin/:dateEnd', checkRights('isActive'), function(req, res, next){
	begin_period = new Date(Number(req.params.dateBegin))
	end_period = new Date(Number(req.params.dateEnd))
	today = new Date();
	query = Reservation.find({room: req.params.room_id,begin:{$lte: end_period}, end:{$gte: begin_period}});
	query.sort('begin')
	query.exec(function(err, reservation_list){
		if (err) console.error(err);
		else {
			console.log(reservation_list);
			res.json(reservation_list);
		}
	});
	
	
});

//check availibility between 2 dates
router.post('/checkavailable', checkRights('isActive'), function(req, res, next){
	dates = req.body.datesToCheck;
	dates_begin = new Date(dates.begin);
	dates_end = new Date(dates.end);
	
	if ( dates_begin >= dates_end ){
		res.status(404).end("The beginning of the period must be BEFORE the end");
	} else {
		Room.find(function(err, roomlist){
			if (err) catchError(err);
			else {
				roomsAvailable = [];
				(function next(index){
					if (index === roomlist.length) { // if no rooms left
				        roomsFree = [];
				        (function txen(xedni){
							if (xedni === roomsAvailable.length){ // if no room available left
								res.json(roomsFree);
								return;
							}
							calculRoomPrice(roomsAvailable[xedni], dates_begin, dates_end, function(err, result){ // calcul price for each available room
								if (err) catchError(err);
								else {
									roomFree = {};
									mix(roomsAvailable[xedni], roomFree);
									roomFree = roomFree._doc;
									roomFree.periodPrice = result.total;
									roomFree.rates = result.rates;
									roomsFree.push(roomFree);
									txen(xedni+1);
									
								}
							});
						})(0);
				        
				    } else { // if there is room left in the room list
					    checkIfReservation( roomlist[index]._id, dates_begin, dates_end, function(err, has_res){
					    	if (err) catchError(err);
							else {
								if (has_res){
									next(index+1);
								} else {
									roomsAvailable.push(roomlist[index]);
									next(index+1);
								}
								
							}
						});
					}
				})(0);
			}
		});
	}
});


//check price for a room between 2 dates
router.post('/checkprice', checkRights('isActive'), function(req, res, next){
	var room_id = req.body.room_id;
	var dates_begin = new Date(req.body.dateBegin);
	var dates_end = new Date(req.body.dateEnd);
	
	if ( dates_begin >= dates_end ){
		res.status(404).end("The beginning of the period must be BEFORE the end");
	} else {
		Room.findOne({_id: room_id}, function(err, room){
			calculRoomPrice(room, dates_begin, dates_end, function(err, result){
				if (err) return catchError(err);
				res.json(result);
				
			});
		});
	}

});

router.post('/change', checkRights('reservation_can_change'), function(req, res, next){
	var begie = new Date(req.body.begin_date);
	var endie = new Date(req.body.end_date);
	var beg = new Date( begie.setHours(14,0,0,0) );
	var end = new Date( endie.setHours(10,0,0,0) );
	var res_modif = req.body.resmodif;

	Reservation.checkIfOther(res_modif, beg, end, function(err, has_res){
		if (err) return catchError(err);
		
		if (has_res) {
			var text_error = "Error : " + "There is already a reservation in these dates"
			res.end(text_error);
		} else {
			Reservation.findOne({'_id': res_modif._id})
			.exec(function(err, reservation){
				if (err) return console.error(err);
				else {
					reservation.begin = beg;
					reservation.end = end;
					reservation.arrival_time = res_modif.arrival_time;
					reservation.room = res_modif.room._id;
					
					calculReservation(reservation, function(err, result){
						if (err) return console.error(err);
						reservation.total_price = result.total;
						reservation.rates = result.rates;
					    reservation.save(function (err, objet) {
							  if (err) return console.error(err);
							  var text_confirmation = "reservation id "+objet._id + " modified";
							  res.end(text_confirmation);
							  createLog( 'modify reservation', 4, req);
						});
					});
				}	
			});
		}
	});

});

router.get('/print_reservation/:res_id/:lang_id/:currency_id', checkRights('isActive'), function(req, res, next){
	var reservation_id = req.params.res_id;
	var language_id = req.params.lang_id;
	var currency_id = req.params.currency_id;
	if ( language_id === undefined ){
		var queryLang = Language.findOne({ by_default: true });
	} else {
		var queryLang = Language.findOne({_id: language_id});
	}
	if ( currency_id === undefined ){
		var queryCurrency = Currency.findOne({by_default: true});
	} else {
		var queryCurrency = Currency.findOne({ _id: currency_id});
	}
	
	Taxe.findOne({ on_rooms: true }, function(err, data){
		if (err) catchError(err);
		else {
			var taxe = data;
			queryLang.exec(function(err, this_language){
				if (err) return console.error(err);
				else {
					queryCurrency.exec(function(err, this_currency){
						if (err) return console.error(err);
						Currency.findOne({by_default: true}, function(err, default_currency){
							if (err) return console.error(err);
							else {
								Reservation.findOne({_id: reservation_id})
									.populate('client room')
									.exec(function(err, reservation){
									if (err) console.error(err);
									else {
										var rates = reservation.rates;
										reservation.default_price_nights = reservation.nights;
										if ( rates && rates.length > 0){
											for ( i=0; i<rates.length; i++ ){
												rates[i].nights = (rates[i].end - rates[i].begin)/(24*60*60*1000);
												reservation.default_price_nights -= rates[i].nights;
											}
											reservation.thisrates = rates;
										}
										reservation.thistotal = reservation.net * ( this_currency.foronedollar / default_currency.foronedollar );
										if ( reservation.discount ){
											reservation.thisdiscount = reservation.discount.amount * ( this_currency.foronedollar / default_currency.foronedollar );
										}
										res.render('documents/reservation', { reservation: reservation, currency: this_currency, taxe: taxe });
									}
								});	
							}
						});
					});
				}
			});
		}
	});
});


//check reservations around date
router.post('/checkOtherReservations', checkRights('isActive'), function(req, res, next){
	begin_period = new Date(req.body.date)
	
	query1 = Reservation.find({ room: req.body.room_id, begin : {$gt: begin_period} });
	query1.sort('begin');
	query2 = Reservation.find({ room: req.body.room_id, end : {$lte: begin_period} });
	query2.sort({'end': -1 });
	query1.exec(function(err, reservationsAfter){	
		if (err) return console.error(err);
		query2.exec(function(err, reservationsBefore){
			if (err) return console.error(err);
			if (reservationsBefore[0]){
				min = reservationsBefore[0].end;
			} else {
				min = null;
			}
			if (reservationsAfter[0]){
				max = reservationsAfter[0].begin;
			} else {
				max = null;
			}
			console.log(min);
			console.log(max);
			var available_period = {
				'min': min,
				'max': max,
			}
			res.json(available_period);
		});
	});
	
});

router.post('/arrivals', checkRights('isActive'), function(req, res, next){
	var dateBeg = req.body.begin;
	var dateEnd = req.body.end;
	Reservation.find({
		$and: [ { begin: { $gte: dateBeg } }, { begin: { $lte: dateEnd } } ],
		}).populate("room").populate("client").exec(function(err, reservations){
			if (err) console.error(err);
			else {
				res.json(reservations);
			}
		});
});

router.post('/departures', checkRights('isActive'), function(req, res, next){
	var dateBeg = req.body.begin;
	var dateEnd = req.body.end;
	Reservation.find({ status: 'checkedin',
		$and: [ { end: { $gte: dateBeg } }, { end: { $lte: dateEnd } } ],
		}).populate("room").populate("client").exec(function(err, reservations){
			if (err) console.error(err);
			else {
				res.json(reservations);
			}
		});
});

router.post('/checkin', checkRights('can_checkin'), function(req, res, next){
	Reservation.findOne({ '_id': req.body.id })
		.populate('client').populate('room')
		.exec(function(err, reservation){
			if (err) console.error(err);
			else {
				if ( reservation.room.occupied ) {
					res.status(400).end(i18n.__("cannot check in, the room is still occupied"));
				} else {
					reservation.status = "checkedin";
					reservation.room.occupied = true;
					reservation.room.save(function(err, room){
						if (err) console.error(err);
						else {
							reservation.save(function(err, reservationToDate){
								if (err) console.error(err);
								else {
									res.json(reservationToDate);
									createLog( 'check in', 3, req);
								}
							});
						}
					});
				}
			}			
			
		});

});

router.post('/checkOut', checkRights('can_checkout'), function(req, res, next){
	var reservation = req.body.reservation;
	Reservation.findOne({ _id: reservation._id }).populate('room').exec(function(err, reserva){
		if (err) return catchError(err);
		else {			
			SubInvoice.find({ client: reserva.client, status: 'waitcheckout' }, function(err, subinvoices){
				if (err) return catchError(err);
				else {
					if ( ( subinvoices && subinvoices.length > 0 ) || reserva.amount_due > 0 ){
						res.status(300).json(i18n.__("Cannot check out, the client has still unpaid invoices remain"));
					} else {
						reserva.status = "checkedout";
						reserva.room.occupied = false;
						reserva.room.save(function(err, room){
							if (err) console.error(err);
							else {
								reserva.save(function(err, reservationToDate){
									if (err) console.error(err);
									else {
										res.json(reservationToDate);
										createLog( 'check out', 3, req);
									}
								});
							}
						});
					}
				}
			});
		}
	});
});


router.get('/checkedin', checkRights('isActive'), function(req, res, next){
	Reservation.find({ status: 'checkedin'})
		.populate('client').populate('room')
		.exec(function(err, reservations){
			if (err) console.error(err);
			else {
				res.json(reservations);
			}
		});
});

router.post('/add_payment', checkRights('isActive'), function(req, res, next){
	var payment = req.body.payment;
	var id = req.body.id;
	
	Reservation.findOneAndUpdate({ _id: id },
		{ $inc: { amount_paid: payment.amount } },
		{ safe: true, new: true },
		function(err, reservation){
			if (err) catchError(err);
			else {
				var newPay = new Payment({
					amount: payment.amount,
					way: payment.way,
					reference: {
						invoice_type: payment.type,
						invoice_ref: id,
					},
					user: req.session.username,
				});
				
				newPay.save(function(err, payment){
					if (err) catchError(err);
					else {
						res.json(reservation);
						createLog( 'made payment', 2, req);
					}
				});
			}
		});
	
});


module.exports = router;
