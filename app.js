var fs = require('fs');
var async = require('async');
var express = require('express');
var session = require('express-session');
var passport = require('passport');
var bodyParser = require('body-parser');
var config;
if (!fs.existsSync('config.js')) {
	console.log('please create configuration file config.js\nsee config-example.js for examples');
} else {
	config = require('./config.js');
}

var mysql = require('mysql');
var app = express();
app.use(session({
	store: config.session_store && new (require(config.session_store)(session))(config.store_opts),
	secret: 'team4',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.render('index', {
		user: req.user
	});
});

app.post('/api/register', function (req, res) {
	passport.authenticate('local-register', (err, user, info) => {
		if (err) console.error(err);
		return res.redirect('/');
	})(req, res);
});

app.post('/api/login', passport.authenticate('local-login'), function (req, res) {
	return res.redirect('/');
});

var db = mysql.createConnection(config.mysql);

async.parallel([
		(cb) => db.connect(cb),
		(cb) => require('./modules/local-passport.js')(passport, db, cb),
		(cb) => app.listen(config.server.port, () => {
			console.error('listening on port ' + config.server.port);
			return cb();
		})
], function (err) {
	if (err) return console.error(err);
});
