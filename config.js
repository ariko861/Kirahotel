var config = module.exports = {};


//determine which database the application will use, mongodb for mongoDB
config.application_port = 24555;

//mongodb configuration

//host for mongodb
config.mongo_host = 'localhost';
//database name
config.mongo_db = 'kirahotel';

//mongo use authentification
config.mongo_auth = true;

// if config.auth == true, fill credentials
config.mongo_user = 'mongomongokirakira';

config.mongo_password = '9163b9bc85da164116bc862a347c52b1';

// if custom port for mongodb : uncomment this line
config.mongo_custom_port = 25139;

config.env = 'PROD';

config.locales_available = ['en', 'fr'];

