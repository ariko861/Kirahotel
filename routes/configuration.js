var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var mongoose = require('mongoose');
var path = require('path');
var Client = require('../model/client');
var Reservation = require('../model/reservation');
var Room = require('../model/room');
var Currency = require('../model/currency');
var Language = require('../model/language');
var Config = require('../model/config');
var Taxe = require('../model/taxe');


var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join( __dirname, '../public/images') )
  },
  filename: function (req, file, cb) {
    cb(null, 'logo.jpg')
  }
})
var upload = multer({ storage: storage })

var currencies = [
	{
		name: "Euro",
		code: "EUR",
		symbol: "€",
	},
	{
		name: "US Dollar",
		code: "USD",
		symbol: "$",
	},
	{
		name: "Indonesian Rupiah",
		code: "IDR",
		symbol: "Rp",
	},
	{
		name: "British Pound",
		code: "GBP",
		symbol: "£",
	},
	{
		name: "Indian Rupee",
		code: "INR",
		symbol: "₹",
	},
	{
		name: "Australian Dollar",
		code: "AUD",
		symbol: "$",
	},
	{
		name: "Canadian Dollar",
		code: "CAD",
		symbol: "$",
	},
	{
		name: "Singapore Dollar",
		code: "SGD",
		symbol: "$",
	},
	{
		name: "Georgian Lari",
		code: "GEL",
		symbol: "ლ",
	},
	
	

]

var listCurrency = function(callback){
	Currency.find(function(err, currencyList){
		if (err) return console.error(err);
		callback("",currencyList);
	});
}

/* GET home page. */
router.get('/', checkRights('configuration_can_change'), function(req, res, next) {
	res.render('configuration', { title: i18n.__('Configuration')});
});


//// routes for currencies //////

router.get('/listcurrencies', checkRights('isActive'), function(req, res, next){
	listCurrency(function(err, list) {
		
		res.json(list);
		
	});
});

router.get('/listActiveCurrencies', checkRights('isActive'), function(req, res, next){
	Currency.find({active: true, by_default: false}).sort('code').exec(function(err, list) {
		if (err) return console.error(err);
		res.json(list);
		
	});
});

router.get('/defaultCurrency', checkRights('isActive'), function(req, res, next){
	Currency.findOne({by_default: true}).exec(function(err, curr) {
		if (err) return console.error(err);
		res.json(curr);
		
	});
});

router.post('/setActiveCurrency', checkRights('configuration_can_change'), function(req, res, next){
	var code = req.body.code;
	var bool = req.body.boolean;
	Currency.update({code : code}, { active: bool }, function(err){
		if (err) return console.error(err);
		res.json("The currency was set to " + bool);
		
	});
	
});

router.post('/setdefaultcurrency', checkRights('configuration_can_change'), function(req, res, next){
	var currency = req.body.id;
	Currency.setToDefault(currency, function(err, result){
		if (err) console.error(err);
		else {
			res.json( result.translated_name + " " + i18n.__("was set to default"))
		}
	});
	
});

router.post('/add_currency', checkRights('configuration_can_change'), function(req, res, next) {
	var new_cur = req.body.new_currency;
	var newCur = new Currency({
		name: new_cur.name,
		code: new_cur.code,
		symbol: new_cur.symbol,
	});
	newCur.save(function(err, data){
		if (err) console.error(err);
		else {
			res.json(data);
		}
	});
	
});

router.post('/updateRate', checkRights('configuration_can_change'), function(req, res, next){
	var currency = req.body.currency;
	Currency.findOneAndUpdate({_id: currency._id},
		{ $set: {foronedollar: currency.foronedollar} }, 
		{ safe: true, new: true }, 
		function(err, result){
			if (err) console.error(err);
			else {
				res.json( result.translated_name + " " + i18n.__("rate was set to") + " "+ result.foronedollar)
			}
	});
	
});

//// end routes for currencies //////


///////////// routes for languages //////////////////

router.get('/listlanguages', checkRights('isActive'), function(req, res, next){
	Language.find(function(err, list) {
		if (err) return console.error(err);
		else {
			res.json(list);
		}
	});
});

router.get('/listactivelanguages', checkRights('isActive'), function(req, res, next){
	Language.find({ active: true }).sort('code').exec(function(err, list) {
		if (err) return console.error(err);
		else {
			res.json(list);
		}
	});
});

router.post('/setActiveLanguage', checkRights('configuration_can_change'), function(req, res, next){
	var lang = req.body.language;
	Language.update({_id : lang._id}, { active: lang.active }, function(err){
		if (err) return console.error(err);
		res.json("The language was set to " + lang.active);
		
	});
	
});

router.post('/add_language', checkRights('configuration_can_change'), function(req, res, next) {
	var new_lang = req.body.new_lang;
	var newLang = new Language({
		name: new_lang.name,
		code: new_lang.code,
	});
	newLang.save(function(err, data){
		if (err) console.error(err);
		else {
			res.json(data);
		}
	});
	
});

router.post('/setdefault', checkRights('configuration_can_change'), function(req, res, next){
	var lang = req.body.id;
	Language.setToDefault(lang, function(err, result){
		if (err) console.error(err);
		else {
			res.json( result.translated_name + " " + i18n.__("was set to default"))
		}
	});
	
});

router.get('/defaultLanguage', checkRights('isActive'), function(req, res, next){
	Language.findOne({by_default: true}).exec(function(err, lang) {
		if (err) return console.error(err);
		res.json(lang);
		
	});
});

///////////// end routes for languages //////////////////

///////////// routes for taxes /////////////////////////


router.get('/listtaxes', checkRights('isActive'), function(req, res, next){
	Taxe.find(function(err, list) {
		if (err) return console.error(err);
		else {
			res.json(list);
		}
	});
});


router.post('/add_taxe', checkRights('configuration_can_change'), function(req, res, next) {
	var new_tax = req.body.new_tax;
	var newTax = new Taxe({
		name: new_tax.name,
		percentage: new_tax.percentage,
	});
	newTax.save(function(err, data){
		if (err) console.error(err);
		else {
			res.json(data);
		}
	});
	
});

router.post('/settaxedefault', checkRights('configuration_can_change'), function(req, res, next){
	var tax = req.body.id;
	Taxe.setToDefault(tax, function(err, result){
		if (err) console.error(err);
		else {
			res.json("was set to default")
		}
	});
	
});

router.post('/settaxeonrooms', checkRights('configuration_can_change'), function(req, res, next){
	var tax = req.body.id;
	Taxe.setOnRooms(tax, function(err, result){
		if (err) console.error(err);
		else {
			res.json( result.translated_name + " " + i18n.__("was set on rooms"))
		}
	});
	
});



router.get('/defaultTax', checkRights('isActive'), function(req, res, next){
	Taxe.findOne({by_default: true}).exec(function(err, result) {
		if (err) return console.error(err);
		res.json(result);
		
	});
});

router.post('/get_option', checkRights('isActive'), function(req, res, next){
	var option_name = req.body.option_name;
	Config.findOne({ option: option_name }, function(err, option){
		if (err) return catchError(err);
		else res.json(option);
	});
	
});



///////////// end routes for taxes /////////////////////

router.post('/uploadLogo', checkRights('configuration_can_change'), upload.single('fileUp'), function(req, res, next) {
		
	res.end("Logo has been uploaded")
	
});

router.post('/update_links_color', checkRights('configuration_can_change'), function(req, res, next){
	var color = req.body.color;
	Config.find({option: 'linkscolor'}, function(err, options){
		if (err) return console.error(err);
		if ( options.length == 0 ) {
			var newConf = new Config({
				option: 'linkscolor',
				valeur: color,
			});
			newConf.save(function(err, newcolor){
				if (err) return console.error(err);
				res.json(i18n.__("the color was set to"+" "+newcolor.valeur));
			});
		} else {
			Config.findOneAndUpdate({option: 'linkscolor'},
				{ $set: { valeur: color } },
				{ safe: true, new: true },
				function(err, newcolor){
					if (err) console.error(err);
					else res.json(i18n.__("the color was set to"+" "+newcolor.valeur));
				}
			);
		}
	});
});

router.get('/initialize', function(req, res, next) {
	listCurrency(function(err, currencyList){
		if (err) return console.error(err);
		if (currencyList.length == 0){
			for ( i=0 ; i < currencies.length ; i++){
				var newCurrency = new Currency(currencies[i]);
				newCurrency.save(function(err) {
					if (err) return console.log(err);
					
				});				
			}
			
		}
	});
	
});

module.exports = router;
