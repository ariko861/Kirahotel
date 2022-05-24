var i18n = require('i18n');
var Log = require('../model/logs');
var catchError = require('./catcherror');

recordLog = function( action, level, req ){
	
	
	if ( level == 'danger' ){ // if log level is danger, send mail or anything
		
	}
	
	var date = new Date();
	
	var newLog = new Log({
		action: action,
		user: req.session.user_id,
		level: level,
		date: date,
	});
	
	
	newLog.save(function(err, newlog){
		if (err) catchError(err);
		Log.populate(newlog, { path: 'user', select: 'username' }, function(err, thislog){		
			if (err) catchError(err);
			else req.io.sockets.emit('logs',newlog);
		});
	});

}

module.exports = recordLog;

