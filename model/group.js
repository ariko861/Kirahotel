var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var ProdSector = require('./prodSector');

var ObjectId = Schema.Types.ObjectId;

var groupSchema = new Schema({
	name: { type: String, required: true },
	is_modifiable: { type: Boolean, default: true },
	
	has_access_client_list: { type: Boolean, default: false },	
	client_can_read_info: { type: Boolean, default: true },
	client_can_add: { type: Boolean, default: true },
	client_can_delete: { type: Boolean, default: false },
	client_can_change: { type: Boolean, default: false },
	
	reservation_can_read_info: { type: Boolean, default: true },
	reservation_can_add: { type: Boolean, default: false },
	reservation_can_delete: {type: Boolean, default: false },
	reservation_can_change: {type: Boolean, default: false },
	
	room_can_read_info: { type: Boolean, default: true },
	room_can_add: { type: Boolean, default: false },
	room_can_delete: {type: Boolean, default: false },
	room_can_change: {type: Boolean, default: false },
	
	can_checkin: {type: Boolean, default: false },
	can_checkout: {type: Boolean, default: false },
	
	can_make_discount: {type: Boolean, default: false },
	
	calendar_has_access: {type: Boolean, default: true },
	
	user_can_add: { type: Boolean, default: false },
	user_can_change: { type: Boolean, default: false },
	user_can_delete: { type: Boolean, default: false },
	
	inventory_can_access: { type: Boolean, default: true },
	product_can_add: { type: Boolean, default: false },
	product_can_change: { type: Boolean, default: false },
	product_can_delete: { type: Boolean, default: false },
	
	invoice_can_delete: { type: Boolean, default: false },
	
	has_access_all_sectors: { type: Boolean, default: true },
	allowed_sectors: [{ type: ObjectId, ref: 'ProdSector' }],
	
	statistics_can_read: { type: Boolean, default: false },
	statistics_can_change: { type: Boolean, default: false },
	can_monitor: { type: Boolean, default: false },
	
	groups_can_manage: { type: Boolean, default: false },
	configuration_can_change: { type: Boolean, default: false },
	is_superuser: {type: Boolean, default: false },
	
});

// function to create superuser group:
// return callback(error) if error
// return callback('',false) if superuser group exists
// else return callback('', Group ) 
groupSchema.statics.createSuperUserGroup = function(callback){
	var superUserGroup = new this();
	this.find({ is_superuser: true }, function(err, groups){
		if (err) return callback(err);
		if ( groups.length > 0 ) { 
			console.log("group superuser already exists");
			callback();
		} else {
			superUserGroup.name = "superuser";
			superUserGroup.is_superuser = true;
			superUserGroup.is_modifiable = false;
			
			superUserGroup.save(callback);
			console.log("group superuser has been created");
		}
	});	
}


module.exports = db.model('Group', groupSchema);
