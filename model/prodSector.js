var db = require('../lib/db')
var Schema = require('mongoose').Schema;
var Language = require('./language');

var ObjectId = Schema.Types.ObjectId;

var sectorSchema = new Schema({
	name: [{
		content: String,
		language: { type: ObjectId, ref: 'Language' },
	}],
	trashed: { type: Boolean, default: false },
});

sectorSchema.statics.listInOneLanguage = function(id, callback){
	var sect = this;
	sect.find().exec(function(err, data){
		if (err) return callback(err);
		else {
			var result = [];
			for ( i=0; i<data.length; i++ ){
				var sector_name = data[i].name[0].content;
				for ( j=0; j<data[i].name.length; j++ ){
					if ( data[i].name[j].language == id ){
						var sector_name = data[i].name[j].content;
					}
				}
				var sector = {
					_id: data[i]._id,
					name: sector_name,
				};
				result.push(sector);
				console.log(sector);
				
			}
			return callback('', result);
		}
	});
}

module.exports = db.model('ProdSector', sectorSchema);
