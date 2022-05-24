var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var mongoose = require('mongoose');
var catchError = require('../lib/catcherror');
var checkRights = require('../lib/rights');
var createLog = require('../lib/recordlogs');
var Room = require('../model/room');
var Rates = require('../model/rates');


var listRooms = function(callback){
	Room.find()
		.populate('rates')
		.sort('room_number')
		.exec(function(err, roomList){
		if (err) return console.error(err);
		callback("",roomList);
	});
}


router.get('/', checkRights('room_can_read_info'), function(req, res, next) {
	res.render('rooms', { title: i18n.__('Rooms management')});
});


router.get('/list', checkRights('isActive'), function(req, res, next){
	listRooms(function(err, roomList) {
		res.json(roomList);
	});
});


router.post('/add', checkRights('room_can_add'), function(req, res, next){
	var room_new = req.body.room;
	var newRoom = new Room({
		room_name: room_new.room_name,
		room_number: room_new.room_number,
	});
	newRoom.save(function (err, objet) {
	  if (err){ 
		  console.error(err);
		  res.end(i18n.__("The room could not be added"));
	  } else {
		  var text_confirmation = i18n.__("new room created");
		  createLog( 'create new room', 4, req);
		  res.end(text_confirmation);
	  }
	});
});

router.post('/changename', checkRights('room_can_change'), function(req, res, next){
	id = req.body.id;
	name = req.body.name;
	Room.update({ _id: id }, { room_name: name }, function(err){
		if (err) return console.error(err);
		res.json(i18n.__("The name was correctly updated"));
		createLog( 'change room name', 3, req);
	});
	
});

router.post('/updatePrice', checkRights('room_can_change'), function(req, res, next){
	
	room_id = req.body.id;
	price = req.body.price;
	
	Room.update({ _id: room_id }, {default_price : price}, function(err){
		if (err) return console.error(err);
		res.json(i18n.__("The price was updated"));
		createLog( 'change room price', 5, req);
	});
	
});

router.post('/addRate', checkRights('room_can_change'), function(req, res, next){
	room_id = mongoose.Types.ObjectId(req.body.id);
	new_rate = mongoose.Types.ObjectId(req.body.new_rate);
	
	Rates.findOne({_id: new_rate}, function(err, rate){
		if (err) return console.error(err);
	
		Room.findOne({_id: room_id}).populate('rates').exec(function(err, room){
			if (err) return console.error(err);
			
			//check if there is no rate at the same dates in this room
			var update = true;
			if (room.rates.length > 0){ // if there is already rates set in this room
				for ( i=0 ; i < room.rates.length ; i++){
					if ( ( ( rate.begin <= room.rates[i].begin ) && ( rate.end <= room.rates[i].begin ) ) || ( ( rate.begin >= room.rates[i].end ) && ( rate.end >= room.rates[i].end ) ) ){
						
					} else {
						console.log(rate.begin, rate.end)
						
						i = room.rates.length;
						update = false;
						res.end(i18n.__("This room has already a rate planned for these dates"));
					}
				}
			}
			// if there is no rate, add this rate to the room
			if (update == true){
				Room.update({ _id: room_id }, { $push: { rates: new_rate } }, function(err){
					if (err) return console.error(err);
					res.end(i18n.__("The rate was added to the room !"));
					createLog( 'add rate to room', 5, req);
				});
			}
		});
	});
});

router.post('/force_free_room', checkRights('room_can_change'), function(req, res, next){
	var room_id = req.body.room_id;
	Room.findOneAndUpdate({ _id: room_id },
	{ $set: { occupied: false } },
	{ safe: true, new: true },
		function(err, room){
			if (err) console.error(err);
			else res.json(i18n.__("The room was set free"));
			createLog( 'room set free manually', 5, req);
		}
	);
});



module.exports = router;
