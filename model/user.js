var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var Group = require('./group');
var Language = require('./language');

var ObjectId = Schema.Types.ObjectId;

var crypto = require('crypto');
var hashmethod = 'sha256'

var userSchema = new Schema({
	username: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	group: { type: ObjectId, ref: 'Group'},
	email: { type: String }, 
	language: { type: ObjectId, ref: 'Language'},
	rights: {
		superuser: { type: Boolean, default: false },
		has_access_client: { type: Boolean, default: false },	
		can_add_client: { type: Boolean, default: false },
		can_modify_client: { type: Boolean, default: false },
		can_delete_client: { type: Boolean, default: false },
		can_add_user: { type: Boolean, default: false },
		can_modify_user: { type: Boolean, default: false },
		can_delete_user: { type: Boolean, default: false },
		can_add_reservation: { type: Boolean, default: false },
		can_check_reservation: {type: Boolean, default: false },
	},
	
});

//function to create super user
// if passwords not match return false
userSchema.statics.createSu = function(username, pass1, pass2, callback){
	var superUser = new this();
	if ( pass1 != pass2 ) {
		callback('',false);
	} else {
		Group.findOne({ name : 'superuser' }, function(err, group){
			if (err) console.error(err);
			else {
				
				superUser.username = username;
				superUser.group = group._id;
				var hash = crypto.createHash(hashmethod).update(pass1).digest('base64');
				superUser.password = hash;
				
				superUser.save(callback);		
			}
		});	
	}
}

userSchema.statics.checkUser = function(login, pass, callback){
	var hash = crypto.createHash(hashmethod).update(pass).digest('base64');
	this.findOne({'username': login}).populate('group').exec(function(err, user){
		if (err) return callback(err);
		else {
			if (user && user.password == hash) callback("",user)
			else callback("","wrongcredentials")
		}
	});
	
}


module.exports = db.model('User', userSchema);
