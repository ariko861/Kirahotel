var express = require('express');
var http = require('http');
var path = require('path');
var session = require('express-session');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var i18n = require('i18n');
var i18nAng = require('i18n-node-angular');
var app_config = require('./config.js');
if ( app_config.env === 'PROD'){
	const MongoStore = require('connect-mongo')(session);
}
var db = require('./lib/db');
var calendars = require('./routes/calendar_routes');
var routes = require('./routes/index');
var users = require('./routes/users');
var clients = require('./routes/clients');
var reservations = require('./routes/reservations');
var rooms = require('./routes/rooms');
var rates = require('./routes/rates');
var sales = require('./routes/sales');
var invoices = require('./routes/invoice');
var configuration = require('./routes/configuration');
var cors = require('cors');
var installation = require('./routes/installation');
var products = require('./routes/products');
var Currency = require('./model/currency');
var Config = require('./model/config');
var io = require('socket.io');

var app = express();

var server = http.createServer(app);




//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'localhost');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

//middleware for authentification, change the path to redirect unauthentificated users

var auth = function (req, res, next){
    if(req.session.logged === true) {
        next();
    } else {
        res.redirect('/');
    }
}



i18n.configure({
	locales: app_config.locales_available,
	directory: __dirname + '/locales',
	cookie: 'locale',
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


/* setup socket.io */
io = io(server);
app.use(function(req, res, next) {
  req.io = io;
  next();
});
io.on('connection', function(socket) {
  //log.info('socket.io connection made');
  console.log('socket.io connection made');
});

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//pour corriger le foutu probleme qui m'a coute des heures de blocage de cross-request !!!
app.use(cors({origin: 'localhost'}));


if ( app_config.env === 'PROD'){
	app.use(session({
		store: new MongoStore({ mongooseConnection: db }),
		secret: 'letoharikedtercesedoc',
	}));
} else {
	app.use( session({ 
		saveUninitialized:true,
		name: 'kirahotel',
		resave: false,
		secret: 'letoharikedtercesedoc',
		
	}));
	
}



app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});

app.use(function(req, res, next){
	Config.findOne({ option: 'linkscolor'}, function(err, color){
		if (err) console.error(err);
		else if (color) res.locals.linkscolor = color.valeur;
		next();
	});
});

//default : use 'accept-language to guess user language settings
app.use(i18n.init);
app.use( i18nAng.getLocale );

app.use(function(req, res, next){
    i18n.setLocale(req.getLocale());
    next();
});
app.locals.__ = i18n.__;


app.use('/', routes);
app.use('/users', users);
app.use('/clients', clients);
app.use('/calendar', calendars);
app.use('/reservations', reservations);
app.use('/rooms', rooms);
app.use('/rates', rates);
app.use('/config', configuration);
app.use('/products', products);
app.use('/invoices', invoices);
app.use('/sales', sales);

app.use('/installation', installation);

//block unauthentificated users
//app.use(auth);

// to use moment in templates
app.locals.moment = require('moment');

//to format string or numbers in jade templates
app.locals.sprintf = require('sprintf-js').sprintf;

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.error(err.message);
    res.render('error', {
      message: err.message,
      error: err,
      __: i18n.__
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    __: i18n.__
  });
});

var debug = require('debug')('generated-express-app');
//var app = require('../app');

app.set('port', process.env.PORT || app_config.application_port);

var server = app.listen(app.get('port'), function() {
    debug('Express server listening on port ' + server.address().port);
});

var io = require('socket.io').listen(server);

app.use(function(req, res, next) {
  req.io = io;
  next();
});

io.sockets.on('connection', function (socket) {
    socket.on('my other event', function (data) {
        console.log(data);
    });
});


module.exports = app;
