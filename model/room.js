var db = require('../lib/db')
var Schema = require('mongoose').Schema;

var Rates = require('./rates');

var ObjectId = Schema.Types.ObjectId;


var roomSchema = new Schema({
	room_name: String,
	room_number: Number,
	max_places: Number,
	occupied: { type: Boolean, default: false },
	default_price: Number,
	rates: [{ type: ObjectId, ref: 'Rates'}],
});

module.exports = db.model('Room', roomSchema);
