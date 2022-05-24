var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var Room = require('../../model/db').Room;
var Reservation = require('../../model/db').Reservation;
var listFunctions = require('../../model/listFunctions')


/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('tests/calendar', { title: 'KiraHotel'});
});

// get the room list to charge the calendar

router.get('/rooms_list', function(req, res, next) {
	listFunctions.listObject(Room, function(err, roomlist) {
		res.json(roomlist);
	});

});


//get the reservations from room with id 'room_id' from dateBegin to dateEnd
router.get('/reservations/:room_id/:dateBegin/:dateEnd', function(req, res, next){
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
	

/*
router.get('/months_list', function(req, res, next) {
	var months = {
		january: i18n.__('January'),
		february: i18n.__('February'),
		march: i18n.__('March'),
		april: i18n.__('April'),
		may: i18n.__('May'),
		june: i18n.__('June'),
		july: i18n.__('July'),
		august: i18n.__('August'),
		september: i18n.__('September'),
		october: i18n.__('October'),
		november: i18n.__('November'),
		december: i18n.__('December'),
		
	};
	res.json(months);
});

router.get('/days_list', function(req, res, next) {
	var days = {
		monday: i18n.__('Monday'),
		tuesday: i18n.__('Tuesday'),
		wednesday: i18n.__('Wednesday'),
		thursday: i18n.__('Thursday'),
		friday: i18n.__('Friday'),
		saturday: i18n.__('Saturday'),
		sunday: i18n.__('Sunday'),
	};
res.json(days);
});
*/




/*
var days = {
	monday: i18n.__('Monday'),
	tuesday: i18n.__('Tuesday'),
	wednesday: i18n.__('Wednesday'),
};
*/
/*
router.get('/login', function(req, res, next) {
	res.render('login');
});

router.post('/login', function(req, res, next) {
	
	manageuser.checkUser(req.body.username, req.body.password, function(err,result){
		if (err) return console.error(err)
		if (result == "wrongpass") res.render('login', {wrongpass: true})
		else if (result == "wronguser") res.render('login', {wronguser: true})
		else{
			req.session.logged = true
			req.session.username = result.username;
			req.session.rights = result.rights;
			res.redirect('/');
		}
	});
});

router.get('/logout', function(req, res, next) {
	req.session.destroy();
	res.redirect('/');
});

router.get('/en', function(req, res, next) {
	i18n.setLocale('en');
	res.redirect('/');
});


router.get('/fr', function(req, res, next) {
	i18n.setLocale('fr');
	res.redirect('/');
});

router.get('/calendar', function(req, res, next) {
  res.render('calendar', { title: 'Express'});
});

router.get('/clients', function(req, res, next) {
	if(req.session.rights.has_access_client || req.session.rights.superuser) {
        res.render('clients', { title: i18n.__('Clients management')});
    } else {
        res.redirect('/not_authorized');
    }
	
});



*/


module.exports = router;
