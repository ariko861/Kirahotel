var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var conf = require('../config');
var listFunctions = require('../model/listFunctions')
var mongoose = require('mongoose');
var User = require("../model/user");
var Client = require('../model/client');
var Reservation = require('../model/reservation');
var Room = require('../model/room');
var catchError = require('../lib/catcherror');
var checkRights = require('../lib/rights');
var Log = require('../model/logs');
var path = require('path');
var fs = require('fs');

/* GET home page. */
router.get('/', checkRights('isActive'), function(req, res, next) {
	res.render('index', { title: 'KiraHotel'});
});

router.get('/translate', checkRights('is_superuser'), function(req, res, next){
	res.render('translate', {title: 'Site translation'});
});

router.get('/statistics', checkRights('statistics_can_read'), function(req, res, next) {
	res.render('statistics', { title: i18n.__('Statistics')});
});

router.get('/monitor', checkRights('can_monitor'), function(req, res, next) {
	res.render('monitor', { title: i18n.__('Monitor')});
});

router.get('/login', function(req, res, next) {
	res.render('login');
});

router.post('/login', function(req, res, next) {
	
	User.checkUser(req.body.username, req.body.password, function(err,result){
		if (err) return console.error(err)
		if (result == "wrongcredentials") res.render('login', {wrongpass: true})
		else{
			req.session.logged = true;
			req.session.user_id = result._id;
			req.session.username = result.username;
			req.session.rights = result.group;
			req.session.user_language = result.language;
			req.session.isActive = true;
			if (req.session.prevUrl) res.redirect(req.session.prevUrl);
			else res.redirect('/');
		}
	});
});

router.get('/logout', function(req, res, next) {
	req.session.destroy();
	res.redirect('/');
});

router.get('/user_infos', function(req, res, next){
	if (req.session.isActive) {
		res.json(req.session);
	} else {
		res.end("there is no user connected")
	}
});


router.get('/en', function(req, res, next) {
	i18n.setLocale('en');
	req.session.locale = 'en';
	var backURL = req.header('Referer') || '/';
	res.redirect(backURL);
});


router.get('/fr', function(req, res, next) {
	i18n.setLocale('fr');
	req.session.locale = 'fr';
	var backURL = req.header('Referer') || '/';
	res.redirect(backURL);
});

router.get('/setlocale/:locale', function(req, res, next) {
	var locale = req.params.locale;
	var availables = conf.locales_available;
	if ( availables.indexOf(locale) >= 0 ){
		i18n.setLocale(locale);
		res.cookie('locale', locale )
	}
	var backURL = req.header('Referer') || '/';
	res.redirect(backURL);	
});

//this function is to actualize the json file in the locale you want
// and to fill the json keys with the keys contained in the en.json
router.get('/mergelocale/:locale', checkRights('is_superuser'), function(req, res, next){
	var locale = req.params.locale;
	var localeURL = path.join( __dirname, "../locales/" );
	var file = localeURL + "en.json";
	var obj;
	fs.readFile(file, 'utf8', function (err, data) {
	  if (err) throw err;
	  obj = JSON.parse(data);
	   var keys = Object.keys( obj );
		var response = ""
		for( var i = 0,length = keys.length; i < length; i++ ) {
			response += i18n.__({ phrase: obj[ keys[ i ] ], locale: locale }) + "\n";
		}
		res.end(response);
	  
	});
});

router.get('/i18ntranslate/json/:locale', checkRights('is_superuser'), function(req, res, next){
	var locale = req.params.locale;
	var localeURL = path.join( __dirname, "../locales/" );
	var file = localeURL + locale + ".json";
	var obj;
	fs.readFile(file, 'utf8', function (err, data) {
	  if (err) throw err;
	  obj = JSON.parse(data);
	  res.json(obj);
	  
	});
});

router.post('/i18ntranslate/update/:locale', checkRights('is_superuser'), function(req, res, next){
	
	var locale = req.params.locale;
	var localeURL = path.join( __dirname, "../locales/" );
	var target = localeURL + locale + ".json";
	
	var translations = req.body.translations;
	var file_text = JSON.stringify(translations, null, '\t')
	 try {
		 
	    var tmp = target + ".tmp";
	    fs.writeFileSync(tmp, file_text, "utf8");
	    var stats = fs.statSync(tmp);
	    if (stats.isFile()) {
	      fs.renameSync(tmp, target);
	      res.end(i18n.__("The locale has been updated"));
	    } else {
	      console.error('unable to write locales to file (either ' + tmp + ' or ' + target + ' are not writeable?): ');
			res.end(i18n.__("There was a problem with the update"));
	    }
	  } catch (e) {
	    console.error('unexpected error writing files (either ' + tmp + ' or ' + target + ' are not writeable?): ', e);
		res.end(i18n.__("There was a problem with the update"));
	  }
	
	
});


router.get('/calendar', checkRights('calendar_has_access'), function(req, res, next) {
  res.render('calendar', { title: 'Express'});
});


router.get("/i18n/:locale", function(req, res, next){
	var locale = req.params.locale;
	var localeURL = path.join( __dirname, "../locales/" )
	res.sendfile( localeURL + locale + ".json" );
	
});
 
router.get("/i18n/:locale/:phrase", function( req, res, next ) {
	var locale = req.params.locale;
	var phrase = req.params.phrase;
	var result = i18n.__( {phrase: phrase, locale: locale} );
	res.send( result );
});




router.get('/fetch_logs', function(req, res, next) {
	var today = new Date();
	var beginDay = new Date( today.setHours(0,0,0,0) );
	
	Log.find({ date: { $gt: beginDay } }).populate('user', 'username')
		.exec(function(err, logs){
			if (err) return catchError(err);
			else res.json(logs);
	});
	
});



/*
//list for database, REMOVE IN PRODUCTION !!!!

router.get('/list/:objet', function(req, res, next) {
	
	switch(req.params.objet){
		
		case "rooms":
			var Objet = Room;
			break
		case "reservations":
			var Objet = Reservation;
			break
		case "clients":
			var Objet = Client;
			break
	}
	
	listFunctions.listObject(Objet, function(err, userlist) {
		res.render('index', {userlist: userlist});
	});
});

/*
 * router.post('/add/:objet', function(req, res, next){
	objet = req.params.objet
	switch(objet){
		case "client":
			var Client = require('../model/db').Client;
			var newObjet = new Client({
				last_name:req.body.last_name,
				first_name:req.body.first_name,
				gender:req.body.gender,
				nationality:req.body.nationality,
				language:req.body.language,
				birthday:req.body.birthday,
				passport: {
					number:req.body.passport_number,
					expiration:req.body.passport_expiration
					},
				phone: { 
					mobile:req.body.phone_mobile,
					office:req.body.phone_office,
					house:req.body.phone_house
					},
				email:req.body.email,
				managed:req.body.managed
			})
			newObjet.save(function (err, objet) {
			  if (err) return console.error(err);
			  var text_confirmation = "new " + objet + " created";
			  
			  res.end(text_confirmation);
			});
			break
		case "room":
			
			var newObjet = new Room({
					room_name: req.body.room_name,
					room_number: req.body.room_number,
					max_places: req.body.max_places,
				});
				newObjet.save(function (err, objet) {
				  if (err) return console.error(err);
				  var text_confirmation = "new " + objet + " created";
				  
				  res.end(text_confirmation);
				});
			break
		case "reservation":
		beg = new Date(req.body.begin_date)
		end = new Date(req.body.end_date)
		
		Reservation.find({ room: req.body.room_id,
			$or: [
				{ $and: [ { begin: { $gt: beg } }, { begin: { $lt: end } } ] },
				{ $and: [ { end: { $gt: beg } }, { end: { $lt: end } } ] },
				]
			}, function(err, result){
				if (err) return console.error(err);
				console.log(result);
				if (result.length > 0) {
					var text_error = "Error : " + "There is already a reservation in these dates"
					res.end(text_error);
				} else {
					var newObjet = new Reservation({
							client: req.body.client_id,
							room: req.body.room_id,
							begin: beg,
							end: end,
						});
					var Client = require('../model/db').Client;
					Client.findOne({'_id': mongoose.Types.ObjectId(req.body.client_id)}, function(err, client){
						if (err) return console.error(err);
						newObjet.client_name = client.last_name;
						newObjet.save(function (err, objet) {
						  if (err) return console.error(err);
						  var text_confirmation = "new " + objet + " created";
						  
						  res.end(text_confirmation);
						});
						
					});
				}
			});
			break
		
	}
	
});

*/


module.exports = router;
