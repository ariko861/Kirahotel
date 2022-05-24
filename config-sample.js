var config = module.exports = {};


//determine which database the application will use, mongodb for mongoDB
config.application_port = 4000;

//mongodb configuration

//host for mongodb
config.mongo_host = 'localhost';
//database name
config.mongo_db = 'kirahotel';

//mongo use authentification
config.mongo_auth = false;

// if config.auth == true, fill credentials
config.mongo_user = 'login';

config.mongo_password = 'password';

// if custom port for mongodb : uncomment this line
//config.mongo_custom_port = 23300


