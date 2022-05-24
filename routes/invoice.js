var express = require('express');
var router = express.Router();
var i18n = require('i18n');
var findIndexByKeyValue = require('../model/listFunctions').findIndexByKeyValue;
var catchError = require('../lib/catcherror');
var createLog = require('../lib/recordlogs');
var checkRights = require('../lib/rights');
var hasSectorAccess = require('../lib/sectoraccess');
var Room = require('../model/room');
var Reservation = require('../model/reservation');
var Client = require('../model/client');
var Currency = require('../model/currency');
var Product = require('../model/produit');
var Material = require('../model/material');
var ProdCategory = require('../model/prodCategory');
var ProdSector = require('../model/prodSector');
var Invoice = require('../model/invoice');
var SubInvoice = require('../model/subInvoice');
var Payment = require('../model/payment');
var Language = require('../model/language');
var Taxe = require('../model/taxe');

var removeMaterialFromStock = function(material_id, q){
	var event = {
		transaction: 'sale',
		quantity: q,
	}
	Material.findOneAndUpdate({ _id: material_id },
		{ $push: { history: event }, $inc: { stock: -q } },
		{ safe: true, new: true },
		function(err, material){
		if (err) return catchError(err);
		
	});
	
}

var removeItemFromStock = function(product_id, q, callback){ // q being the quantity sold
	Product.findOne({ _id: product_id }, function(err, product){
		if (err) return catchError(err);
		if ( product ){
			if ( product.manage_stock ){
				if ( product.stock_type == 'piece' ) {
					product.stock -= q;
				} else if ( product.stock_type == 'material') {
					for (i=0; i<product.contents.length; i++){
						removeMaterialFromStock( product.contents[i].material, q * product.contents[i].quantity );
					}
				}
			}
			var event = {
				transaction: 'sale',
				quantity: q,
			}
			product.history.push(event);
			product.save(function(err, newproduct){
				if (err) callback(err);
				else callback('', newproduct);
				
			});
		}
	});
	
}

var processInvoiceItems = function(invoice){
	if ( invoice.items && invoice.items.length > 0 ){
		for (i=0; i<invoice.items.length; i++){
			removeItemFromStock(invoice.items[i].reference, invoice.items[i].quantity, function(err, prod){
				if (err) catchError(err);
			});
		}
	}
}


router.get('/', checkRights('isActive'), function(req, res, next) {
	res.render('invoices', { title: i18n.__('Invoice management')});
});

router.post('/createinvoice', checkRights('isActive'), function(req, res, next){
	var client_id = req.body.client_id;
	var newInv = new Invoice({
		client: client_id,
	});
	newInv.save(function(err, new_invoice){
		if (err) return console.error(err);
		else {
			Invoice.populate(new_invoice, { path: "client" }, function(err, invoice){
				if (err) console.error(err);
				else res.json(invoice);
			});
		}
	});
	
});

router.post('/list_payments', checkRights('statistics_can_read'), function(req, res, next){
	var beg = new Date(req.body.period.begin);
	var ed = new Date(req.body.period.end);
	var begin = new Date( beg.setHours(0,0,0,0) );
	var end = new Date( ed.setHours(23,59,59,999) );
	Payment.find({
			$and : [ { date: { $gte: begin } }, { date: { $lte: end } } ],
		}, function(err, payments){
			if (err) catchError(err);
			else res.json(payments);
		}
	);
	
	
});

router.post('/list_invoices', checkRights('statistics_can_read'), function(req, res, next){
	var beg = new Date(req.body.period.begin);
	var ed = new Date(req.body.period.end);
	var begin = new Date( beg.setHours(0,0,0,0) );
	var end = new Date( ed.setHours(23,59,59,999) );
	SubInvoice.find({
			$and : [ { date: { $gte: begin } }, { date: { $lte: end } } ],
		}).populate('client sector').exec(function(err, subinvoices){
			if (err) catchError(err);
			else res.json(subinvoices);
		}
	);
	
	
});


router.get('/list_sub_invoices/:sector_id', checkRights('isActive'), function(req, res, next){
	var id = req.params.sector_id;
	SubInvoice.find({status: "open", sector: id}).populate('client').exec(function(err, invoices){
		if (err) return console.error(err);
		else res.json(invoices);
	});
});

router.post('/create_sub_invoice', checkRights('isActive'), function(req, res, next){
	var new_inv = req.body.new_inv;
	var sector_id = req.body.sector_id;
	var newInv = new SubInvoice({
			sector: sector_id,
			id_number: new_inv.id_number,
			
		});
	newInv.save(function(err, newInvoice){
		if (err) return console.error(err);
		else {
			res.json(newInvoice);
			createLog( 'create invoice', 1, req);
		}
	});
});

router.post('/delete_sub_invoice', checkRights('invoice_can_delete'), function(req, res, next){
	var invoice_id = req.body.invoice_id;
	SubInvoice.remove({ _id: invoice_id, status: "open" }, function(err){
		if (err) return catchError(err);
		else {
			res.json(i18n.__("The invoice has been deleted"));
			createLog( 'delete invoice', 5, req);
		}
	});
	
});

router.post('/add_item', checkRights('isActive'), function(req, res, next){
	var item = req.body.item;
	var q = req.body.quantity;
	var invoice_id = req.body.invoice_id;
	var prod = ({
		designation: item.name,
		description: item.description,
		price: item.price,
		quantity: q,
		reference: item._id,
	});
	
	SubInvoice.findOneAndUpdate({ _id: invoice_id },
		{ $push: { items: prod } },
		{ safe: true, new: true },
		function(err, invoice){
			if (err) console.error(err);
			else {
				res.json({ 'item': prod, 'invoice':	invoice });
				createLog( 'add item to invoice', 0, req);
			}
		}
	);
});

router.post('/remove_item', checkRights('isActive'), function(req, res, next){
	var item_id = req.body.item_id;
	var invoice_id = req.body.invoice_id;
	
	SubInvoice.findOneAndUpdate({ _id: invoice_id },
		{ $pull: { items: { _id: item_id} } },
		{ safe: true, new: true },
		function(err, invoice){
			if (err) console.error(err);
			else {
				res.json(invoice);
				createLog( 'remove item from invoice', 4, req);
			}
		}
	);
});


router.post('/add_client', checkRights('isActive'), function(req, res, next){
	var client_id = req.body.client_id;
	var invoice_id = req.body.invoice_id;
	
	SubInvoice.findOneAndUpdate({ _id: invoice_id },
		{ $set: { client: client_id } },
		{ safe: true, new: true },
		function(err, invoice){
			if (err) console.error(err);
			else {
				SubInvoice.populate(invoice, { path: "client" }, function(err, invoice){
					if (err) console.error(err);
					else {
						res.json(invoice.client);
						createLog( 'assign client to invoice', 1, req);
					}
				});
			}
		}
	);
});


router.post('/detach_client', checkRights('isActive'), function(req, res, next){
	var invoice_id = req.body.invoice_id;
	
	SubInvoice.findOneAndUpdate({ _id: invoice_id },
		{ $set: { client: undefined } },
		{ safe: true, new: true },
		function(err, invoice){
			if (err) console.error(err);
			else {
				res.json(i18n.__("the customer was removed from the invoice"));
				createLog( 'cancel client assignment to invoice', 2, req);
			}
		}
	);
});

router.post('/add_discount', checkRights('can_make_discount'), function(req, res, next){
	var invoice_id = req.body.invoice_id;
	var discount = req.body.discount;
	
	SubInvoice.findOneAndUpdate({ _id: invoice_id },
		{ $set: { discount: discount } },
		{ safe: true, new: true },
		function(err, invoice){
			if (err) catchError(err);
			else {
				res.json(invoice);
				createLog( 'made discount', 4, req);
			}
		}
	);
});

router.post('/remove_discount', checkRights('can_make_discount'), function(req, res, next){
	var invoice_id = req.body.invoice_id;
	
	SubInvoice.findOneAndUpdate({ _id: invoice_id },
		{ $set: { discount: undefined } },
		{ safe: true, new: true },
		function(err, invoice){
			if (err) catchError(err);
			else {
				res.json(invoice);
				createLog( 'cancel discount', 4, req );
			}
		}
	);
});

router.post('/add_payment', checkRights('isActive'), function(req, res, next){
	var payment = req.body.payment;
	var invoice_id = req.body.invoice_id;
	
	if ( payment.type == 'subinvoice' ){
		var obj = SubInvoice;
	} else if ( payment.type == 'invoice' ){
		var obj = Invoice;
	} else {
		res.status(400).end(i18n.__("Wrong type of invoice"));
	}
	
	obj.findOneAndUpdate({_id: invoice_id},
		{ $inc: { amount_paid: payment.amount } },
		{ safe: true, new: true },
		function(err, invoice){
			if (err) catchError(err);
			else {
				var newPay = new Payment({
					amount: payment.amount,
					way: payment.way,
					reference: {
						invoice_type: payment.type,
						invoice_ref: invoice_id,
					},
					user: req.session.username,
				});
				
				newPay.save(function(err, payment){
					if (err) catchError(err);
					else {
						res.json(invoice);
						createLog( 'made payment', 2, req );
					}
				});
				
				if ( invoice.paid ) {
					obj.findOneAndUpdate({_id: invoice_id},
						{ $set: { status: 'paid' } },
						{ safe: true, new: true },
						function(err, invoice){
							if (err) catchError(err);
							else processInvoiceItems(invoice);
						}
					);
				}				
			}
		}
	);
	
});

router.post('/add_to_reservation_invoice', checkRights('isActive'), function(req, res, next){
	var thisinvoice = req.body.invoice;
	
	Reservation.checkIfClientCheckIn( thisinvoice.client._id, function(err, result){
		if (err) return catchError(err);
		else {
			
			if (result) {	
				SubInvoice.findOneAndUpdate({_id: thisinvoice._id},
					{ $set: { status: 'waitcheckout' } },
					{ safe: true, new: true },
					function(err, invoice){
						if (err) catchError(err);
						else {
							processInvoiceItems(invoice);
							res.json(i18n.__("The invoice has been added to the reservation"));
							createLog( 'add invoice to checked in client', 2, req );
						}
					}
					
				);
			} else {
				res.status(400).end(i18n.__("The client is not checked in"))
			}
		}
	});
	
});

router.post('/get_client_invoices', checkRights('isActive'), function(req, res, next){
	var client_id = req.body.client_id;
	SubInvoice.find({ client: client_id, status: { $in: ['waitcheckout', 'paid'] } }).populate('sector').exec(function(err, invoices){
		if (err) catchError(err);
		else res.json(invoices);
	});
});

router.post('/createGlobalInvoice', checkRights('can_checkin'), function(req, res, next){
	var new_inv = req.body.newInv;
	var newInv = new Invoice(new_inv);
	newInv.save(function(err, invoice){
		if (err) catchError(err);
		else res.json(invoice);

	});
	
});

router.post('/cancel_global_invoice', checkRights('can_checkin'), function(req, res, next){
	var invoice_id = req.body.invoice_id;
	Invoice.findOne({ _id: invoice_id, status: 'open' }, function(err, invoice){
		if (err) return catchError(err);
		if ( invoice ){
			Invoice.remove({ _id: invoice_id}, function(err){
				if (err) catchError(err);
				else {
					res.json(i18n.__("The invoice has been removed"))
					createLog( 'cancel golbal invoice', 3, req );
				}
			});
		} else {
			res.status(300).json( i18n.__("The invoice cannot be cancelled now") )
		}
	});
});

router.post('/get_room_global_invoice', checkRights('isActive'), function(req, res, next){
	var room_id = req.body.room_id;
	Invoice.find({ room: room_id, status: 'open'})
		.populate('client')
		.exec(function(err, invoices){
		if (err) return catchError(err);
		else res.json(invoices);
	});
});


router.post('/subinvoices/add_payment', checkRights('can_chekin'), function(req, res, next){
	var payment = req.body.payment;
	var id = req.body.id;
	
	SubInvoice.findOneAndUpdate({ _id: id },
		{ $inc: { amount_paid: payment.amount } },
		{ safe: true, new: true },
		function(err, invoice){
			if (err) catchError(err);
			else {
				if ( invoice.paid <= 0 ){
					invoice.status = "paid";
					invoice.save(function(err, invoice_saved){
						if (err) return catchError(err);
					});
				}
				var newPay = new Payment({
					amount: payment.amount,
					way: payment.way,
					reference: {
						invoice_type: payment.type,
						invoice_ref: id,
					},
					user: req.session.username,
				});
				
				newPay.save(function(err, payment){
					if (err) catchError(err);
					else {
						res.json(invoice);
						createLog( 'made payment', 2, req );
					}
				});
			}
		});
	
});

router.post('/add_global_payment', checkRights('can_checkin'), function(req, res, next){
	// TO CHANGE ALL
	
	var payment = req.body.payment;
	var documents = req.body.documents;
	
	var docs = [];
	var reference = [];
	if ( documents.reservations && documents.reservations.length > 0 ){
		for ( i=0; i<documents.reservations.length; i++ ){
			docs.push(documents.reservations[i]);
			var thisref = {
				invoice_type: 'reservation',
				invoice_ref: documents.reservations[i]._id,
			};
			reference.push( thisref );
		}
	}
	if ( documents.subinvoices && documents.subinvoices.length > 0 ){
		for ( i=0; i<documents.subinvoices.length; i++ ){
			docs.push(documents.subinvoices[i]);
			var thisref = {
				invoice_type: 'invoice',
				invoice_ref: documents.subinvoices[i]._id,
			};
			reference.push( thisref );
		}
	}
	console.log(documents);
	console.log(docs);
	var money = payment.amount;
	
	(function next(index){
		if (index == docs.length || money == 0){
			var newPay = new Payment({
				amount: payment.amount,
				way: payment.way,
				reference: reference,
				user: req.session.username,
			});
			
			newPay.save(function(err, payment){
				if (err) catchError(err);
				else {
					res.json(payment);
					createLog( 'made payment', 2, req );
					return;
				}
			});
			
		} else {
			if ( docs[index].sector ) { // to check if doc[index] is subinvoice
				SubInvoice.findOne({ _id: docs[index]._id }, function( err, subinvoice ){
					if (err) return catchError(err);
					else {
						var due = subinvoice.amount_due;
						if ( money >= due ){
							subinvoice.amount_paid += due;
							money = money - due;
							subinvoice.status = "paid";
						} else {
							subinvoice.amount_paid += money;
							money = 0;
						}
						
						subinvoice.save(function(err, result){
							if (err) catchError(err);
							next(index+1);
							console.log(money);
						});
					}
				});
			} else {
				Reservation.findOne({ _id: docs[index]._id }, function( err, reservation ){
					if (err) return catchError(err);
					else {
						var due = reservation.amount_due
						if ( money >= due ){
							reservation.amount_paid += due;
							money = money - due;
						} else {
							reservation.amount_paid += money;
							money = 0;
						}
						reservation.save(function(err, result){
							if (err) catchError(err);
							next(index+1);
							console.log(money);
						});
					}
				});
				
			}
		}
	})(0);
});

router.post('/checkOut', checkRights('can_checkout'), function(req, res, next){
	var invoice_id = req.body.invoice_id;
	Invoice.findOneAndUpdate({ _id: invoice_id, status: 'paid' },
		{ $set: { status: 'paidandout' } },
		{ safe: true, new: true },
		function(err, invoice){
			if (err) return catchError(err);
			if ( !invoice ) return res.status(400).json(i18n.__("Cannot find this invoice, maybe it hasn't been paid yet ?"))
			if ( invoice.reservations && invoice.reservations.length > 0 ){
				Reservation.find({ _id: { $in: invoice.reservations } }, function(err, reservations){
					if (err) return catchError(err);
					var rooms = [];
					for ( i=0; i<reservations.length; i++ ){
						rooms.push(reservations[i].room);
					}
					Room.where().setOptions({ multi: true })
						.update({ _id: { $in: rooms } },
						{ $set: { occupied: false } },
						function(err) {
							if (err) return catchError(err);
							else {
								res.json(i18n.__("The room has been checked out and the room(s) freed"))
								createLog( 'check out client', 3, req );
							}
						});
					
				});	
			} else {
				res.json("The client has been checked out")
			}
	});
});


router.get('/list_open_global_invoices', function(req, res, next){
	Invoice.find({ status: { $in: ['open', 'blocked', 'paid'] } }, function(err, invoices){
		if (err) catchError(err);
		else res.json(invoices);
	});
});

router.get('/print_subinvoice/:invoice_id/:lang_id/:currency_id', function(req, res, next){
	var invoice_id = req.params.invoice_id;
	var language_id = req.params.lang_id;
	var currency_id = req.params.currency_id;
	Taxe.findOne({ by_default: true }, function(err, data){
		if (err) catchError(err);
		else {
			var taxe = data;
			Currency.findOne({ _id: currency_id}, function(err, this_currency){
				if (err) return console.error(err);
				Currency.findOne({by_default: true}, function(err, default_currency){
					if (err) return console.error(err);
					else {
						SubInvoice.findOne({_id: invoice_id}, function(err, invoice1){
							if (err) console.error(err);						
							else {
								SubInvoice.populate(invoice1, { path: "client" }, function(err, invoice){
									if (err) console.error(err);
									if (!invoice) return res.status(404).end();
									else {
										var products = invoice.items;
										for ( i=0; i<products.length; i++ ){
											var x = findIndexByKeyValue(products[i].designation, 'language', language_id);
											products[i].thisdesignation = products[i].designation[x].content;
											
											if ( products[i].description ){
												var y = findIndexByKeyValue(products[i].description, 'language', language_id);
												if ( products[i].description[y] ){
													products[i].thisdescription = products[i].description[y].content;
												}
											}
											products[i].thisprice = products[i].price * ( this_currency.foronedollar / default_currency.foronedollar );
											
										}
										invoice.items = products;
										invoice.thistotal = invoice.net * ( this_currency.foronedollar / default_currency.foronedollar );
										if ( invoice.discount ){
											invoice.thisdiscount = invoice.discount.amount * ( this_currency.foronedollar / default_currency.foronedollar );
										}
										res.render('documents/subInvoice', { invoice: invoice, currency: this_currency, taxe: taxe });
									}
								});
							}
						});	
					}
				});
			});
		}
	});
});

router.get('/print_global_invoice/:inv_id/:lang_id/:currency_id', function(req, res, next){
	var invoice_id = req.params.inv_id;
	var language_id = req.params.lang_id;
	var currency_id = req.params.currency_id;
	if ( language_id === undefined ){
		var queryLang = Language.findOne({ by_default: true });
	} else {
		var queryLang = Language.findOne({_id: language_id});
	}
	if ( currency_id === undefined ){
		var queryCurrency = Currency.findOne({by_default: true});
	} else {
		var queryCurrency = Currency.findOne({ _id: currency_id});
	}
	
	Taxe.findOne({ on_rooms: true }, function(err, datar){
		if (err) catchError(err);
		else {
			var taxerooms = datar;
			Taxe.findOne({ on_rooms: true }, function(err, dataf){
				if (err) catchError(err);
				else {
					var taxedef = dataf;
			
					queryLang.exec(function(err, this_language){
						if (err) return console.error(err);
						else {
							ProdSector.listInOneLanguage(this_language._id, function(err, sectors){
								if (err) return catchError(err);
								else {
									queryCurrency.exec(function(err, this_currency){
										if (err) return console.error(err);
										Currency.findOne({by_default: true}, function(err, default_currency){
											if (err) return console.error(err);
											else {
												Invoice.findOne({_id: invoice_id})
													.populate('client reservations subinvoices')
													.exec(function(err, invoice){
													if (err) console.error(err);
													else {
														for ( i=0; i<invoice.subinvoices; i++){
															
														}
														invoice.thistotal = invoice.net * ( this_currency.foronedollar / default_currency.foronedollar );
														if ( invoice.discount ){
															invoice.thisdiscount = reservation.discount.amount * ( this_currency.foronedollar / default_currency.foronedollar );
														}
														res.render('documents/globalinvoice', { invoice: invoice, currency: this_currency, language: this_language, taxerooms: taxerooms, taxedef: taxedef, sectors: sectors });
													}
												});	
											}
										});
									});
								}
							});
						}
					});
				}
			});
		}
	});
});


// in case of problems, check again the subinvoices with status 'waitcheckout' to see if they are paid
// if paid assign the good status
router.get('/check_subinvoice_if_paid/:id', checkRights('isActive'), function(req, res, next){
	var id = req.params.id;
	SubInvoice.findOne({ _id: id }, function(err, subinvoice){
		if (err) return catchError(err);
		else {
			if ( subinvoice ){
				if ( subinvoice.paid ){
					subinvoice.status = 'paid';
					subinvoice.save(function(err, result){
						if (err) catchError(err);
						else res.end(i18n.__("Done"))
					});
				}		
			} else {
				res.end(i18n.__("No invoice found"))
			}
		}
	});
});



module.exports = router;
