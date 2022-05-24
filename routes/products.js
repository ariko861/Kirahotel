var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var mongoose = require('mongoose');
var findIndexByKeyValue = require('../model/listFunctions').findIndexByKeyValue;
var catchError = require('../lib/catcherror');
var checkRights = require('../lib/rights');
var createLog = require('../lib/recordlogs');
var Room = require('../model/room');
var Reservation = require('../model/reservation');
var Client = require('../model/client');
var Currency = require('../model/currency');
var Product = require('../model/produit');
var ProdCategory = require('../model/prodCategory');
var ProdSector = require('../model/prodSector');
var Material = require('../model/material');


router.get('/', checkRights('inventory_can_access'), function(req, res, next) {
	res.render('products', { title: i18n.__('Products management'), management: true});
});

router.get('/sectorlist', checkRights('isActive'), function(req, res, next){
	ProdSector.find(function(err, sectors){
		if (err) catchError(err);
		else {
			res.json(sectors);
		}
	});
});

router.get('/list', checkRights('isActive'), function(req, res, next){
	Product.find({ trashed: false }).populate('contents.material').exec(function(err, products){
		if (err) catchError(err);
		else {
			res.json(products);
		}
	});
});

router.get('/productsFromSector/:sectorid', checkRights('isActive'), function(req, res, next){
	var id = req.params.sectorid;
	Product.find({ sector: id, trashed: false }, function(err, products){
		if (err) catchError(err);
		else {
			res.json(products);
		}
	});
});

router.get('/categorylist',  checkRights('isActive'), function(req, res, next){
	ProdCategory.find({ trashed: false }, function(err, categories){
		if (err) catchError(err);
		else {
			res.json(categories);
		}
	});
});

router.get('/categoriesFromSector/:sectorid', checkRights('isActive'), function(req, res, next){
	var id = req.params.sectorid;
	ProdCategory.find({ sector: id, trashed: false }, function(err, categories){
		if (err) catchError(err);
		else {
			res.json(categories);
		}
	});
});

router.get('/materialslist', checkRights('isActive'), function(req, res, next){
	
	Material.find({ trashed: false }, function(err, materials){
		if (err) catchError(err);
		else {
			res.json(materials);
		}
	});
});

router.post('/add_material', checkRights('product_can_change'), function(req, res, next) {
	var new_material = req.body.new_material;
	var newMat = new Material({
		name: new_material.name,
		unit: new_material.unit,
		sector: new_material.sector,
	});
	newMat.save(function(err, data){
		if (err) catchError(err);
		else {
			res.json(data);
			createLog( 'add new material', 2, req);
		}
	});
	
});

router.post('/add_sector', checkRights('configuration_can_change'), function(req, res, next) {
	var new_sector = req.body.new_sector;
	var newSector = new ProdSector({
		name: new_sector.name,
	});
	newSector.save(function(err, data){
		if (err) catchError(err);
		else {
			res.json(data);
			createLog( 'add new sector', 4, req);
		}
	});
	
});

router.post('/addcategory', checkRights('product_can_add'), function(req, res, next) {
	var new_cat = req.body.new_cat;
	var newCategory = new ProdCategory({
		name: new_cat.name,
		sector: new_cat.sector,
	});
	newCategory.save(function(err, data){
		if (err) catchError(err);
		else {
			res.json(data);
			createLog( 'add new category', 2, req);
		}
	});
	
});


router.post('/addproduct', checkRights('product_can_add'), function(req, res, next) {
	var new_prod = req.body.new_prod;
	var newProd = new Product({
		name: new_prod.name,
		price: new_prod.price,
		sector: new_prod.sector,
		category: new_prod.category,
		description: new_prod.description,
		manage_stock: new_prod.manage_stock,
		stock_type: new_prod.stock_type,
		contents: new_prod.contents,
	});
	newProd.save(function(err, data){
		if (err) catchError(err);
		else {
			res.json(data);
			createLog( 'add new product', 2, req);
		}
	});
	
});

router.post('/change_product', checkRights('product_can_change'), function(req, res, next) {
	var new_prod = req.body.prod;
	Product.findOneAndUpdate({ _id: new_prod._id },
		{ $set: { name: new_prod.name,
			price: new_prod.price,
			sector: new_prod.sector,
			category: new_prod.category,
			description: new_prod.description,
			manage_stock: new_prod.manage_stock,
			stock_type: new_prod.stock_type,
			contents: new_prod.contents,
		} },
		{ safe: true, new: true },
		function(err, data){
			if (err) catchError(err);
			else {
				res.json(data);
				createLog( 'modify product', 2, req);
			}
		});
	
});


router.post('/deletecategory', checkRights('product_can_delete'), function(req, res, next) {
	var id = req.body.id;
	ProdCategory.toTrash({ _id: id }, function(err){
		if (err) catchError(err);
		else {
			res.json(i18n.__("the category and all his items were put to trash" ) );
			createLog( 'delete product category and all products inside', 5, req);
		}
	});		
	
});

router.post('/deleteproduct', checkRights('product_can_delete'), function(req, res, next) {
	var id = req.body.id;
	Product.toTrash({ _id: id }, function(err){
		if (err) catchError(err);
		else {
			res.json(i18n.__("the product was put to trash" ) );
			createLog( 'delete product', 3, req);
		}
	});		
	
});

router.post('/update_stock',  checkRights('product_can_change'), function(req, res, next) {
	var product = req.body.product;
	var record = {};
	record.quantity = product.stockToAdd
	if ( product.stockToAdd >= 0 ){
		record.transaction = "supply";
	} else {
		record.transaction = "trash";
	}
	record.date = new Date();
	
	Product.findOneAndUpdate({ _id: product._id },
		{ $inc: { stock: product.stockToAdd }, $push: { history: record } },
		{ safe: true, new: true },
		function(err, data){
			if (err) catchError(err);
			else {
				res.json(data);
				createLog( 'update stock', 1, req);
			}
		});	
});

router.post('/update_stock_material', checkRights('product_can_change'), function(req, res, next) {
	var material = req.body.material;
	
	var record = {};
	record.quantity = material.stockToAdd
	if ( record.stockToAdd >= 0 ){
		record.transaction = "supply";
	} else {
		record.transaction = "trash";
	}
	record.date = new Date();
	
	Material.findOneAndUpdate({ _id: material._id },
		{ $inc: { stock: material.stockToAdd }, $push: { history: record } },
		{ safe: true, new: true },
		function(err, data){
			if (err) catchError(err);
			else {
				res.json(data);
				createLog( 'update stock', 1, req);
			}
		});	
	
});

router.get('/print_price_list/:sector/:language/:currency', function(req, res, next){
	var sector_id = req.params.sector;
	var language_id = req.params.language;
	var currency_id = req.params.currency;
	
	Currency.findOne({ _id: currency_id}, function(err, this_currency){
		if (err) return catchError(err);
		Currency.findOne({by_default: true}, function(err, default_currency){
			ProdCategory.find({ sector: sector_id, trashed: false }, function(err, catlist){
				if (err) catchError(err);
				else {
					var menu = {};
					(function next(index){
						if ( index == catlist.length ){
							res.render('priceList', { menu: menu, categories: catlist, currency: this_currency } );
							return;
						} else {
							var cat = catlist[index];
							var z = findIndexByKeyValue(cat.name, 'language', language_id);
							console.log( cat.name[z] + 'content: '+ cat.name[z].content );
							catlist[index].thisname = cat.name[z].content;
							
							Product.find({ category: cat._id , sector: sector_id, trashed: false }, function(err, products){
								if (err) return catchError(err);
								else {
									for ( i=0; i<products.length; i++ ){
										var x = findIndexByKeyValue(products[i].name, 'language', language_id);
										products[i].thisname = products[i].name[x].content;
										
										if ( products[i].description ){
											var y = findIndexByKeyValue(products[i].description, 'language', language_id);
											if ( products[i].description[y] ){
												products[i].thisdescription = products[i].description[y].content;
											}
										}
										products[i].thisprice = products[i].price * ( this_currency.foronedollar / default_currency.foronedollar );
										
									}
									menu[cat._id] = products;
									next(index+1);
								}
							});
						}
						
						
					})(0);
				
				}
			});
		});
	});	
});

module.exports = router;
