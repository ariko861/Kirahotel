$(document).ready(function(){
	
	
	clockdate = document.getElementById('clockdate');
	clocktime = document.getElementById('clocktime');
	
	
	var clockwork = setInterval(
	
	function() {

		now = new Date();
		
		var day = ((now.getDate()<10) ? "0" : "")+ now.getDate();
		var month = (((now.getMonth() + 1) <10) ? "0" : "")+ ( now.getMonth() + 1 );
		
		var today = day + "/" + month + "/" + ( 1900 + now.getYear() );
		
		var hour = ((now.getHours()<10) ? "0" : "")+ now.getHours();
		var minutes = ((now.getMinutes()<10) ? "0" : "")+ now.getMinutes();
		var seconds = ((now.getSeconds()<10) ? "0" : "")+ now.getSeconds();
		
		var time = hour + ":" + minutes + ":" + seconds
		
		clockdate.innerHTML = today;
		clocktime.innerHTML = time;
	
	}, 1000 )
		
	
	
});
