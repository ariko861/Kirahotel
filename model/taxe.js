var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var i18n = require('i18n');

var taxSchema = new Schema({
	name: String,
	percentage: { type: Number },
	on_rooms: {type: Boolean, default: false },
	by_default: {type: Boolean, default: false },
});

taxSchema.virtual('translated_name').get(function () {
	return ( i18n.__(this.name) );
});

taxSchema.set('toJSON', { virtuals: true });

//set on language to default true, others to default false, return default language if success
taxSchema.statics.setToDefault = function(id, callback){
	var tax = this;
	tax.where().setOptions({ multi: true }).update({ $set: { by_default: false } },  function(err){
		if (err) return callback(err);
		else {
			tax.findOneAndUpdate({ _id: id }, { $set: { by_default: true } }, function(err, def){
				if (err) return callback(err);
				else return callback('', def);
			});
		}
	});
}

taxSchema.statics.setOnRooms = function(id, callback){
	var tax = this;
	tax.where().setOptions({ multi: true }).update({ $set: { on_rooms: false } },  function(err){
		if (err) return callback(err);
		else {
			tax.findOneAndUpdate({ _id: id }, { $set: { on_rooms: true } }, function(err, def){
				if (err) return callback(err);
				else return callback('', def);
			});
		}
	});
}

module.exports = db.model('Taxe', taxSchema);


