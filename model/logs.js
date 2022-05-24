var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var User = require('./user');
var i18n = require('i18n');

var ObjectId = Schema.Types.ObjectId;

var logSchema = new Schema({
	date: { type: Date, default: Date() },
	action: { type: String },
	user: { type: ObjectId, ref: 'User' },
	level: { type: Number }, // number from 0 to 5, 5 needing the most attention

});

logSchema.virtual('translated_action').get(function () {
	return ( i18n.__(this.action) );
});

logSchema.set('toJSON', { virtuals: true });

module.exports = db.model('Log', logSchema);

