var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var i18n = require('i18n');

var currencySchema = new Schema({
	name: String,
	code: { type: String, unique: true },
	symbol: String,
	active: { type: Boolean, default: true },
	by_default: { type: Boolean, default: false },
	foronedollar: { type: Number, default: 1 },
});

currencySchema.virtual('translated_name').get(function () {
	return ( i18n.__(this.name) );
});

currencySchema.set('toJSON', { virtuals: true });


//set one currency to default true, others to default false, return default currency if success
currencySchema.statics.setToDefault = function(id, callback){
	var curr = this;
	curr.where().setOptions({ multi: true }).update({ $set: { by_default: false } },  function(err){
		if (err) return callback(err);
		else {
			curr.findOneAndUpdate({ _id: id }, { $set: { by_default: true } }, function(err, def){
				if (err) return callback(err);
				else return callback('', def);
			});
		}
	});
}


module.exports = db.model('Currency', currencySchema);
