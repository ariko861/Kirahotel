var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var i18n = require('i18n');
var Language = require('./language');

var ObjectId = Schema.Types.ObjectId;

var clientSchema = new Schema({
	last_name: String,
	first_name: String,
	gender: String,
	nationality: String,
	language: { type: ObjectId, ref: 'Language'},
	birthday: {
		day: Number,
		month: String,
		year:Number,
	},
	passport:{
		number:String,
		expiration:{
			day: Number,
			month: String,
			year:Number,
		}
	},
	phone:{
		mobile:String,
		office:String,
		house:String,
	},
	email:String,
	managed: { type: Boolean, default: true },
	
});

clientSchema.virtual('full_name').get(function () {
	return ( this.first_name + ' ' + this.last_name );
});

clientSchema.set('toJSON', { virtuals: true });


clientSchema.statics.listWithTranslation = function(callback){
	Client.find(function(err, clientList){
		if (err) return console.error(err);
		for ( i=0 ; i<clientList.length ; i++ ) {
			clientList[i].birthday.month = i18n.__(clientList[i].birthday.month) 
		}
		callback("",clientList);
	});
}




module.exports = db.model('Client', clientSchema);

