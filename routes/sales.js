var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var catchError = require('../lib/catcherror');
var checkRights = require('../lib/rights');

router.get('/', checkRights('isActive'), function(req, res, next) {
	res.render('sales', { title: i18n.__('Sales'), sale: true});
});



module.exports = router;
