var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var hashmethod = 'sha256';
var i18n = require('i18n');
var mongoose = require('mongoose');
var User = require('../model/user');
var Group = require('../model/group');
var catchError = require('../lib/catcherror');
var checkRights = require('../lib/rights');
var createLog = require('../lib/recordlogs');

var checkIfUserExist = function(username, callback){
	User.findOne({'username': username}, function(err, user){
		if (err) callback(err);
		if (user == null) callback("",false);
		else callback("",true);
	});
}

var checkIfGroupExist = function(name, callback){
	Group.findOne({'name': name}, function(err, group){
		if (err) callback(err);
		if (group == null) callback("",false);
		else callback("",true);
	});
}

/* GET users listing. */
router.get('/', checkRights('user_can_add'), function(req, res, next) {
	res.render('user_management', { title: i18n.__('Users management')});

	
});


router.post('/add', checkRights('user_can_add'), function(req, res, next) {
	new_user = req.body.new_user
	checkIfUserExist(new_user.username, function(err, has_user){
		if (err) return catchError(err);
		if (has_user){
			res.status(404).json("A user with this username already exist !")
		} else {
			var hash = crypto.createHash(hashmethod).update(new_user.password).digest('base64');
			var newUser = new User({
				username: new_user.username,
				password: hash,
				language: new_user.language,
				email: new_user.email,
				group: new_user.group,
			});
			
			newUser.save(function (err, newuser) {
			  if (err) return catchError(err);
			  res.json("New user "+ newuser.username + " created");
			  createLog( 'add new user', 4, req);
	
			});
		}
	});
	
});

router.post('/addgroup', checkRights('groups_can_manage'), function(req, res, next) {
	new_group = req.body.new_group
	checkIfGroupExist(new_group.name, function(err, has_group){
		if (err) return catchError(err);
		if (has_group){
			res.status(404).json("A group with this name already exist !")
		} else {
			var newGroup = new Group({
				name: new_group.name,
			});
			
			newGroup.save(function (err, newgroup) {
			  if (err) return catchError(err);
			  res.json("New group "+ newgroup.name + " created");
			  createLog( 'add new group', 5, req);
	
			});
		}
	});
	
});

router.get('/create_super_user', function(req, res, next) {
	form = '<form action="/users/create_super_user" method="post">'+
			'username :<input type="text" name="username"></br>'+
			'password :<input type="password" name="password"></br>'+
			'<input type="submit" value="Submit">'
	res.send(form);
});

router.post('/create_super_user', function(req, res, next) {
	manageuser.createAdmin(req.body.username, req.body.password, function(err,newUser){
		if (err) return console.error(err)
		else if (newUser == 'already') res.end("You can't create more than one superuser")
		else res.end("the superuser " + newUser.username + " was created");
		
	});
});


// to delete user
router.post('/delete', checkRights('user_can_delete'), function(req, res, next){
	
	User.remove({'_id': mongoose.Types.ObjectId(req.body.user_id)}, function(err){
		if (err) return catchError(err);
		var user_deleted = "The user number " + req.body.user_id + " was deleted";
		res.json(user_deleted);
		createLog( 'delete user', 5, req);
	});
	
});

router.post('/changegroup', checkRights('groups_can_manage'), function(req, res, next){
	var user_id = req.body.user_id;
	var group_id = req.body.group_id;
	User.update({'_id': user_id }, {'group': group_id}, function(err){
			if (err) return catchError(err);
			res.json("The user was updated")
			createLog( 'change user group', 5, req);
		
	});
	
});

router.post('/changelanguage', checkRights('user_can_change'), function(req, res, next){
	var user_id = req.body.user_id;
	var lang_id = req.body.lang_id;
	User.update({'_id': user_id }, {'language': lang_id}, function(err){
			if (err) return catchError(err);
			res.json("The user was updated")
			createLog( 'change user language', 3, req);
		
	});
	
});


//list users except superuser
router.get('/list', checkRights('user_can_add'), function(req, res, next) {
	var groups_id = [];
	var username = req.session.username;
	if ( req.session.rights.is_superuser ) {
		User.find({'username': {$ne: username} }).select("-password").populate('group language').exec(function(err, userList){
			if (err) return catchError(err);
			res.json(userList);
		});
	} else {
		Group.find( { $or: [ {'is_superuser': true }, {'groups_can_manage': true} ] }, function(err, groupList){
			if (err) return catchError(err);
			for ( i=0 ; i < groupList.length ; i++ ){
				groups_id.push(groupList[i]._id);
			}
			User.find({'group': { $nin: groups_id }, 'username': {$ne: username} }).select("-password").populate('group language').exec(function(err, userList){
				if (err) return catchError(err);
				res.json(userList);
			});
		});
	}
});


router.get('/list_usernames', checkRights('user_can_add'), function(req, res, next) {
	User.find({}).select("username").exec(function(err, usernames){
		if (err) catchError(err);
		else res.json(usernames);
	});
});

router.get('/list_groups', checkRights('user_can_add'), function(req, res, next) {
	if (req.session.rights.is_superuser ) {
			Group.find().populate('allowed_sectors').exec(function(err, groupList){
			if (err) return catchError(err);
			res.json(groupList);
		});
	} else if( req.session.rights.groups_can_manage ) {
		Group.find({'is_superuser':false}).populate('allowed_sectors').exec(function(err, groupList){
			if (err) return catchError(err);
			res.json(groupList);
		});
	} else {
		Group.find({'is_modifiable':true, 'groups_can_manage': false, 'is_superuser':false}).populate('allowed_sectors').exec(function(err, groupList){
			if (err) return catchError(err);
			res.json(groupList);
		});
		
	}
});

// to delete group
router.post('/deletegroup', checkRights('groups_can_manage'), function(req, res, next){
	
	User.find({'group': mongoose.Types.ObjectId(req.body.group_id), 'is_modifiable':true}, function(err, users){
		if (err) return catchError(err);
		if ( users.length > 0 ) {
			return catchError("There are still users in this group, you must delete them before");
		} else {
			Group.remove({'_id': mongoose.Types.ObjectId(req.body.group_id)}, function(err){
				if (err) return catchError(err);
				var group_deleted = "The group number " + req.body.user_id + " was deleted";
				res.json(group_deleted);
				createLog( 'delete group', 5, req);
			});
		}
	});
	
});


router.post('/addsectoraccess', checkRights('groups_can_manage'), function(req, res, next){
	var groupie = req.body.group;
	Group.findOneAndUpdate({_id: groupie._id},
		{ $push: { allowed_sectors: groupie.newsector} },
		{ safe: true, new: true },
		function(err, bgroup){
			if (err) return console.error(err);
			else {
				Group.populate(bgroup, { path: "allowed_sectors" }, function(err, group){
					if (err) return console.error(err);
					else {
						res.json(group);
						createLog( 'add access to sector', 4, req);
					}
				});
			}
		}
	);
	
});

router.post('/removesectoraccess', checkRights('groups_can_manage'), function(req, res, next){
	var groupie = req.body.group;
	var id = req.body.sector_id;
	
	Group.findOneAndUpdate({_id: groupie._id},
		{ $pull: { allowed_sectors: id } },
		{ safe: true, new: true },
		function(err, bgroup){
			if (err) return console.error(err);
			else {
				Group.populate(bgroup, { path: "allowed_sectors" }, function(err, group){
					if (err) return console.error(err);
					else {
						res.json(group);
						createLog( 'remove access to sector', 4, req);
					}
				});
			}
		}
	);
	
});


router.get('/get_rights_list', checkRights('isActive'), function(req, res, next){
	var rights_list = [
			{
				right: 'has_access_client_list',
				name: i18n.__("Can access to client list"),
				description: i18n.__("Can display the whole list of clients, keep it false if you want to avoid the user being able to copy the client database"),
			},
			{
				right: 'client_can_read_info',
				name: i18n.__("Can read client information"),
				description: i18n.__("Can read client information, should be allowed for everybody"),
			},
			{
				right: 'client_can_add',
				name: i18n.__("Can add new client"),
				description: i18n.__("Can add a new customer, true by default, depending on your policy you might forbid it"),
			},
			{
				right: 'client_can_delete',
				name: i18n.__("Can delete client"),
				description: i18n.__("Can delete a customer from the database, should be allowed only to director or manager"),
			},
			{
				right: 'client_can_change',
				name: i18n.__("Can change client informations"),
				description: i18n.__("Can change client informations, should be allowed only to receptionist ( director and manager as well )"),
			},
			{
				right: 'reservation_can_read_info',
				name: i18n.__("Can read reservation informations"),
				description: i18n.__("can read reservation information, true by default"),
			},
			{
				right: 'reservation_can_add',
				name: i18n.__("Can add new reservation"),
				description: i18n.__("Can add a new reservation, should be allowed only to receptionist"),
			},
			{
				right: 'reservation_can_change',
				name: i18n.__("Can change reservation"),
				description: i18n.__("Can modify a reservation, should be allowed only to receptionist"),
			},
			{ 
				right:'reservation_can_delete',
				name: i18n.__("Can delete reservation"),
				description: i18n.__("Can delete a reservation, should be allowed only to manager and director"),
			},
			{
				right: 'room_can_read_info',
				name: i18n.__("Can read rooms informations"),
				description: i18n.__("can read rooms information, true by default"),
			},
			{
				right: 'room_can_add',
				name: i18n.__("Can add new room"),
				description: i18n.__("Can add a new room, should be allowed only to director"),
			},
			{
				right: 'room_can_change',
				name: i18n.__("Can change room"),
				description: i18n.__("Can modify a room, should be allowed only to manager and director"),
			},
			{ 
				right:'room_can_delete',
				name: i18n.__("Can delete room"),
				description: i18n.__("Can delete a room, should be allowed only to director"),
			},
			{ 
				right:'inventory_can_access',
				name: i18n.__("Can access inventory"),
				description: i18n.__("Can acces inventory, should be allowed to anybody,  true by default"),
			},
			{ 
				right:'product_can_add',
				name: i18n.__("Can add product"),
				description: i18n.__("Can add a product, should be allowed to sectors manager"),
			},
			{ 
				right:'product_can_change',
				name: i18n.__("Can change product"),
				description: i18n.__("Can change a product, should be allowed to sectors manager"),
			},
			{ 
				right:'product_can_delete',
				name: i18n.__("Can delete product"),
				description: i18n.__("Can delete a product, should be allowed to manager and director only"),
			},
			{ 
				right:'invoice_can_delete',
				name: i18n.__("Can delete invoice"),
				description: i18n.__("Can delete an invoice, should be allowed to sector managers"),
			},
			
			{
				right: 'can_checkin',
				name: i18n.__("Can check in"),
				description: i18n.__("Can check in a customer, should be allowed to receptionist"),
			},
			{
				right:'can_checkout',
				name: i18n.__("Can check out"),
				description: i18n.__("Can check out a customer, should be allowed to receptionist"),
			},
			{
				right: 'can_make_discount',
				name: i18n.__("Can make discount"),
				description: i18n.__("Can make discount to customer, depends on your policy"),
			},
			{
				right:'calendar_has_access',
				name: i18n.__("Can display calendar"),
				description: i18n.__("Can display calendar, true by default"),
			},
			{
				right: 'user_can_change',
				name: i18n.__("Can modify user"),
				description: i18n.__("Can modify user information, should only be allowed to director and manager"),
			}, 
			{
				right: 'user_can_delete',
				name: i18n.__("Can delete user"),
				description: i18n.__("Can delete a user, should be allowed only to director"),
			},
			{
				right: 'user_can_add', 
				name: i18n.__("Can add user"),
				description: i18n.__("Can add a new user, should be allowed to manager and director"),
			},
			{
				right: 'has_access_all_sectors',
				name: i18n.__("Can access all sectors"),
				description: i18n.__("Can access to all sectors"),
			},
			{
				right: 'statistics_can_read', 
				name: i18n.__("Can read statistics"),
				description: i18n.__("Can read statistics, should be allowed to manager and director"),
			},
			{
				right: 'statistics_can_change', 
				name: i18n.__("Can change statistics"),
				description: i18n.__("Can change statistics, should be allowed only to director"),
			},
			{
				right: 'can_monitor', 
				name: i18n.__("Can monitor"),
				description: i18n.__("Has access to monitor and all logs, should be allowed to director and to manager"),
			},
		];

	var superuseronly = [
				{
					right: 'is_superuser',
					name: i18n.__("Is superuser"),
					description:i18n.__("Rights of superuser"),
				},
				{
					right: 'is_modifiable',
					name: i18n.__("Group modifiable"),
					description: i18n.__("If set to false, only superuser can change this group"),
				},
				{
					right: 'groups_can_manage',
					name: i18n.__("Can manage groups"),
					description: i18n.__("can add and change groups, should be allowed only to director"),
				},
				{
					right: 'configuration_can_change',
					name: i18n.__("Can change configuration"),
					description: i18n.__("can change software configuration, should be allowed only to director"),
				},
		];
	if ( req.session.rights.is_superuser ) {
		for ( i = 0 ; i < superuseronly.length ; i++ ) {
			rights_list.push(superuseronly[i]);
		}
	}
	
	res.json(rights_list);
	
});

router.post('/change_rights', checkRights('groups_can_manage'), function(req, res, next){
	var rights = req.body.new_rights;
	var group_id = req.body.group_id;
	if (req.session.rights.is_superuser) {
		Group.update({'_id': group_id}, {
				has_access_client_list: rights['has_access_client_list'],	
				client_can_read_info: rights['client_can_read_info'],
				client_can_add: rights['client_can_add'],
				client_can_delete: rights['client_can_delete'],
				client_can_change: rights['client_can_change'],
				reservation_can_read_info: rights['reservation_can_read_info'],
				reservation_can_add: rights['reservation_can_add'],
				reservation_can_delete: rights['reservation_can_delete'],
				reservation_can_change: rights['reservation_can_change'],
				room_can_read_info: rights['room_can_read_info'],
				room_can_add: rights['room_can_add'],
				room_can_delete: rights['room_can_delete'],
				room_can_change: rights['room_can_change'],
				inventory_can_access: rights['inventory_can_access'],
				product_can_add: rights['product_can_add'],
				product_can_change: rights['product_can_change'],
				product_can_delete: rights['product_can_delete'],
				invoice_can_delete: rights['invoice_can_delete'],
				can_checkin: rights['can_checkin'],
				can_checkout: rights['can_checkout'],
				can_make_discount: rights['can_make_discount'],
				calendar_has_access: rights['calendar_has_access'],
				has_access_all_sectors: rights['has_access_all_sectors'],
				user_can_add: rights['user_can_add'],
				user_can_change: rights['user_can_change'],
				user_can_delete: rights['user_can_delete'],
				configuration_can_change: rights['configuration_can_change'],
				statistics_can_read: rights['statistics_can_read'],
				statistics_can_change: rights['statistics_can_change'],
				can_monitor: rights['can_monitor'],
				
				
				groups_can_manage: rights['groups_can_manage'],
				
				is_superuser: rights['is_superuser'],
				is_modifiable: rights['is_modifiable'],
				
			}, function(err){
				if (err) return catchError(err);
				res.json("The group was updated")
				createLog( 'change group rights', 4, req);
		});
	
		
	} else {
		Group.update({'_id': group_id, 'is_modifiable':true }, {
				has_access_client_list: rights['has_access_client_list'],	
				client_can_read_info: rights['client_can_read_info'],
				client_can_add: rights['client_can_add'],
				client_can_delete: rights['client_can_delete'],
				client_can_change: rights['client_can_change'],
				reservation_can_read_info: rights['reservation_can_read_info'],
				reservation_can_add: rights['reservation_can_add'],
				reservation_can_delete: rights['reservation_can_delete'],
				reservation_can_change: rights['reservation_can_change'],
				room_can_read_info: rights['room_can_read_info'],
				room_can_add: rights['room_can_add'],
				room_can_delete: rights['room_can_delete'],
				room_can_change: rights['room_can_change'],
				inventory_can_access: rights['inventory_can_access'],
				product_can_add: rights['product_can_add'],
				product_can_change: rights['product_can_change'],
				product_can_delete: rights['product_can_delete'],
				invoice_can_delete: rights['invoice_can_delete'],
				can_checkin: rights['can_checkin'],
				can_checkout: rights['can_checkout'],
				can_make_discount: rights['can_make_discount'],
				calendar_has_access: rights['calendar_has_access'],
				has_access_all_sectors: rights['has_access_all_sectors'],
				user_can_add: rights['user_can_add'],
				user_can_change: rights['user_can_change'],
				user_can_delete: rights['user_can_delete'],
				statistics_can_read: rights['statistics_can_read'],
				statistics_can_change: rights['statistics_can_change'],
				can_monitor: rights['can_monitor'],
				
				
			}, function(err){
				if (err) return catchError(err);
				res.json("The group was updated")
				createLog( 'change group rights', 4, req);
			
		});
	}
	
});

module.exports = router;
