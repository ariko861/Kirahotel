var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var Config = require('../model/config')
var Group = require('../model/group');
var User = require('../model/user');

function skipIfInstallationDone(req, res, next){
	Config.findOne( { option : 'installation_done' }, function( err, config ){
		if ( config && config.value == true ){
			res.end(i18n.__("The installation has been done already"));
		} else {
			next();
		}
	});
}

function endInstallation(){
	var endConfig = new Config;
	endConfig.option = 'installation_done';
	endConfig.value = true;
	
	endConfig.save();
	
}

router.get('/', skipIfInstallationDone, function(req, res, next) {
	Group.createSuperUserGroup(function(err, group){
		if (err) return console.error(err);
		else {
			res.render('installation');
		}
		
	});
	
});

router.post('/', skipIfInstallationDone, function(req, res, next) {
	var username = req.body.username;
	var pass1 = req.body.password1;
	var pass2 = req.body.password2;
	
	User.createSu( username, pass1, pass2, function(err, user){
		if (err) console.error(err);
		else {
			if ( user == false ){
				res.end("The passwords did not match")
			} else {
				endInstallation();
				res.end("The superuser "+ user.username +" has been created");
			}
		}
		
	});
});

module.exports = router;
