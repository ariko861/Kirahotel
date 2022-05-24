var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var i18n = require('i18n');

var languageSchema = new Schema({
	name: String,
	code: { type: String, unique: true },
	active: {type: Boolean, default: true },
	by_default: {type: Boolean, default: false },
});

languageSchema.virtual('translated_name').get(function () {
	return ( i18n.__(this.name) );
});

languageSchema.set('toJSON', { virtuals: true });

//set on language to default true, others to default false, return default language if success
languageSchema.statics.setToDefault = function(id, callback){
	var lang = this;
	lang.where().setOptions({ multi: true }).update({ $set: { by_default: false } },  function(err){
		if (err) return callback(err);
		else {
			lang.findOneAndUpdate({ _id: id }, { $set: { by_default: true } }, function(err, def){
				if (err) return callback(err);
				else return callback('', def);
			});
		}
	});
}

module.exports = db.model('Language', languageSchema);

