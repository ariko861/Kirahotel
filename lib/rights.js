var i18n = require('i18n');

checkRights = function(right){
	return function(req, res, next) {
		if (!req.session.isActive){
			if(req.xhr) res.end({"err":"usrErr"});
			else {
				req.session.prevUrl = req.originalUrl;
				res.redirect('/login');
			}
		} else {
			if (right == 'isActive') next();
			else if (req.session.rights[right] || req.session.rights.is_superuser){
				next();
			} else {
				res.end(i18n.__("You are not authorized"))
			}
		}
	}
}

module.exports = checkRights;
