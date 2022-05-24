
var listFunctions = module.exports = {};



listFunctions.listObject = function(Objet, callback){
	Objet.find(function(err, objetslist){
		if (err) return console.error(err);
		else {
			
			callback("",objetslist);
		}
	});
}

listFunctions.findIndexByKeyValue = function(arraytosearch, key, valuetosearch) {

	for (var i = 0; i < arraytosearch.length; i++) {
	
	if (arraytosearch[i][key] == valuetosearch) {
	return i;
	}
	}
	return null;
}

listFunctions.sendError = function(error){
	console.log(error);
	res.status(500).send("There was a problem in the server");	
}

