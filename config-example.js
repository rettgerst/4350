module.exports = {
	host: 'localhost:3000',
	mysql: {
		host     : 'localhost',
		user     : 'root',
		password : 'root',
		database : 'patio'
	},
	server: {
		port: 3000
	},
	session_store: '', // session store for express-session
	store_opts: {}, // consult your chosen store for options
	forecast: {
		service: 'darksky',
		key: '', // darksky api key
		units: 'fahrenheit',
		cache: true,
		ttl: {
			minutes: 27,
			seconds: 45
		}
	},
	transport: '', // transport module for use with nodemailer
	transport_options: { } // consult your chosen transport for options
};
