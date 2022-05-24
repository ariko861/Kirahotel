var i18n = require('i18n');

hasAccessSector = function(id){
	return function(req, res, next) {
		if (!req.session.isActive){
			if(req.xhr) res.end({"err":"usrErr"});
			else {
				req.session.prevUrl = req.originalUrl;
				res.redirect('/login');
			}
		} else {
			if (req.session.rights.has_access_all_sectors) next();
			else if (req.session.rights.allowed_sectors.indexOf(id) > -1 ){
				next();
			} else {
				res.end(i18n.__("You are not authorized"))
			}
		}
	}
}

module.exports = hasAccessSector;

