var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var i18nRoutes = require('i18n-node-angular');
var Room = require('../model/room');
var Reservation = require('../model/reservation');
var listFunctions = require('../model/listFunctions')
var catchError = require('../lib/catcherror');
var checkRights = require('../lib/rights');

function mix(source, target) {
 for(var key in source) {
 if (source.hasOwnProperty(key)) {
 target[key] = source[key];
 }
 }

}

/* GET home page. */
router.get('/', checkRights('calendar_has_access'), function(req, res, next) {
	res.render('calendar', { title: 'Calendar'});
});

// get the room list to charge the calendar

router.get('/rooms_list', checkRights('isActive'), function(req, res, next) {
	listFunctions.listObject(Room, function(err, roomlist) {
		res.json(roomlist);
	});

});


//get the reservations from room with id 'room_id' from dateBegin to dateEnd
router.get('/getallreservations/:dateBegin/:dateEnd', checkRights('isActive'), function(req, res, next){
	beggie = new Date(Number(req.params.dateBegin))
	end_period = new Date(Number(req.params.dateEnd))
	today = new Date();
	begin_period = new Date(beggie.setHours(6,0,0,0))
	
	listFunctions.listObject(Room, function(err, roomlist) {
		if (err) return console.error(err);
		var listAllReservations = [];
		(function next(index) {
		    if (index === roomlist.length) { // No items left
		        res.json(roomlist);
		        return;
		    }
		    var listReservations = {};
		    mix(roomlist[index], listReservations);
		    listReservations = listReservations._doc;
		    listReservations.reservations = {};
		    var roomie = roomlist[index];
		    //roomie.reservations = [];
		    var query = Reservation.find({room: roomie._id,begin:{$lte: end_period}, end:{$gte: begin_period}});
		    query.sort('begin')
		    query.exec(function(err, reservation_list){
				if (err) console.error(err);
				else {
					
					listReservations.reservations = reservation_list;
					listAllReservations.push(listReservations)
					next(index+1);
				}
			});
		})(0);
		
	});
	
});



//get next reservation after :date
router.get('/getnextreservation/:room/:date', checkRights('isActive'),  function(req, res, next){
	begin_period = new Date(Number(req.params.date))
	query1 = Reservation.find({ room: req.params.room, begin : {$gt: begin_period} });
	query1.sort('begin');
	query2 = Reservation.find({ room: req.params.room, end : {$lte: begin_period} });
	query2.sort({'end': -1 });
	query1.exec(function(err, reservationsAfter){	
		if (err) return console.error(err);
		query2.exec(function(err, reservationsBefore){
			if (err) return console.error(err);
			if (reservationsBefore[0]){
				min = reservationsBefore[0].end;
			} else {
				min = "";
			}
			if (reservationsAfter[0]){
				max = reservationsAfter[0].begin;
			} else {
				max = "";
			}
			var available_period = {
				'min': min,
				'max': max,
			}
			res.json(available_period);
		});
	});
	
});




router.get('/purge', function(req, res, next){
	
	
});




module.exports = router;
