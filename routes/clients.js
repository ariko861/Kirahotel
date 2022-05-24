var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var catchError = require('../lib/catcherror');
var checkRights = require('../lib/rights');
var createLog = require('../lib/recordlogs');

var mongoose = require('mongoose');
var Client = require('../model/client');
var Reservation = require('../model/reservation');


/* GET home page. */
router.get('/', checkRights('client_can_read_info'), function(req, res, next) {
	res.render('clients', { title: i18n.__('Clients management')});
});

router.get('/list', function(req, res, next){
	Client.find().populate('language').exec(function(err, clientList) {
		if (err) console.error(err);
		else {
			res.json(clientList);
		}
	});
});

router.post('/add', checkRights('client_can_add'), function(req, res, next){
	newclient = req.body.newclient
	if (!newclient.passport){
		newclient.passport = {};
	}
	if (!newclient.phone){
		newclient.phone = {};
	}
	
	var newClient = new Client({
		last_name : newclient.last_name, 
		first_name : newclient.first_name, 
		gender : newclient.gender, 
		nationality : newclient.nationality, 
		language : newclient.language._id, 
		birthday : newclient.birthday, 
		passport : {
			number : newclient.passport.number, 
			expiration : newclient.passport.expiration
		}, 
		phone : { 
			mobile : newclient.phone.mobile, 
			office : newclient.phone.office, 
			house : newclient.phone.house
		}, 
		email : newclient.email, 
	});
	
	newClient.save(function (err, newClient) {
		  if (err) return console.error(err);
		  Client.findOne({ _id: newClient._id }).populate('language').exec(function(err, result){
			  if (err) console.error(err);
			  else {
				res.json(result);
				createLog( 'add new client', 2, req);
			}
		  });
	});
});

router.post('/update_client', checkRights('client_can_change'), function(req, res, next){
	client = req.body.client
	
	Client.findOneAndUpdate({ _id: client._id },
		{ $set: {
			last_name : client.last_name, 
			first_name : client.first_name, 
			gender : client.gender, 
			nationality : client.nationality, 
			language : client.language._id, 
			birthday : client.birthday, 
			passport : client.passport,
			phone : client.phone,
			email : client.email,
		} },
		{ safe: true, new: true },
		function(err, newClient) {
			  if (err) return console.error(err);
			  Client.populate(newClient, { path: "language" }, function(err, result){
				  if (err) console.error(err);
				  else {
					res.json(result);
					createLog( 'modify client', 2, req);
				}
			  });
		}
	);
});

router.post('/delete', checkRights('client_can_delete'), function(req, res, next){
	Client.remove({'_id': mongoose.Types.ObjectId(req.body.id)}, function(err){
		if (err) return console.error(err);
		var client_deleted = "The client number " + req.body.id + " was deleted";
		res.end(client_deleted);
		createLog( 'removed client', 5, req);
	});
});

router.post('/fetch', checkRights('client_can_read_info'), function(req, res, next){
	search = req.body.query;
	values = search.split(" ");
	for ( i=0 ; i < values.length ; i++ ){
		values[i] = new RegExp(values[i], "i");
	}
	Client.find( {
			$or : [
				{ $or : [
					{ first_name : { $all: values } }, 
					{ last_name : { $all: values } },
				
				] },
				{ $and : [
					{ first_name : { $in: values } }, 
					{ last_name : { $in: values } },
				
				] },
				{ passport : { number : { $in: values } } },
			 
			]
		
			
		}, function(err, matchingQuery){
			if (err) return console.error(err);
			res.json(matchingQuery);
		
	});
	
	
});


router.post('/ischeckedin', checkRights('client_can_read_info'), function(req, res, next){
	var client_id = req.body.client_id;
	Reservation.checkIfClientCheckIn( client_id, function(err, result){
		if (err) return catchError(err);
		else res.json(result);
	});
});

module.exports = router;
