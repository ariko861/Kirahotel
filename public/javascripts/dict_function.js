// function to search for a value in a list of objects
function findIndexByKeyValue(arraytosearch, key, valuetosearch) {

for (var i = 0; i < arraytosearch.length; i++) {

if (arraytosearch[i][key] == valuetosearch) {
return i;
}
}
return null;
}

// function to add days to a date
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
