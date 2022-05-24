var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var mongoose = require('mongoose');
var Rates = require('../model/rates');
var Rooms = require('../model/room');
var catchError = require('../lib/catcherror');
var checkRights = require('../lib/rights');
var createLog = require('../lib/recordlogs');

var listRates = function(callback){
	Rates.find().sort('begin').exec(function(err, list){
		if (err) return console.error(err);
		callback("",list);
	});
}


router.get('/list', checkRights('isActive'), function(req, res, next){
	listRates(function(err, list) {
		res.json(list);
	});
});


router.post('/add', checkRights('room_can_change'), function(req, res, next){
	
	beg = new Date(req.body.newRate.begin);
	end = new Date(req.body.newRate.end);
	
	if ( end > beg ){
		var newRates = new Rates({
			name: req.body.newRate.name,
			begin: beg,
			end: end,
			price: req.body.newRate.price,
		});
		newRates.save(function (err, objet) {
		  if (err) return console.error(err);	  
		  res.json(objet);
		  createLog( 'add new rate', 1, req);
		});
	
	} else {
		res.writeHead(500);
		res.end("The beginning of the period must be BEFORE the end");
		
	}
});

router.post('/updatePrices', checkRights('room_can_change'), function(req, res, next){
	
	room_id = req.body.id;
	price = req.body.price;
	
	Room.update({ _id: room_id }, {default_price : prices}, function(err){
		if (err) return console.error(err);
		res.json("The prices were changed");
		createLog( 'change room price', 3, req);
	});
	
});

router.post('/delete', checkRights('room_can_change'), function(req, res, next){
	rate_id = req.body.id;
	Rates.remove({'_id': mongoose.Types.ObjectId(rate_id)}, function(err){
		if (err) return console.error(err);
		var rate_deleted = "The rate number " + rate_id + " was deleted";
	});
	Rooms.where().setOptions({ multi: true }).update({ }, {$pull: { rates: { _id: rate_id } } }, function(err){
		if (err) return console.error(err);
		res.end("The rates where deleted successfully");
		createLog( 'delete rate', 3, req);
	});
});

module.exports = router;
