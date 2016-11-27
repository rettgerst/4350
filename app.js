var fs = require('fs');
var async = require('async');
var express = require('express');
var session = require('express-session');
var passport = require('passport');
var bodyParser = require('body-parser');
var Forecast = require('forecast');
var config;
if (!fs.existsSync('config.js')) {
	console.log('please create configuration file config.js\nsee config-example.js for examples');
} else {
	config = require('./config.js');
}

var forecast = new Forecast(config.forecast);
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

app.use('/node_modules',  express.static(__dirname + '/node_modules'));

app.get('/', function (req, res) {
	if (!req.user) {
		res.render('register', {
			user: req.user
		});
	} else {
		res.render('index', {
			user: req.user
		});
	}
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

app.post('/api/searchRestaurants', function (req, res) {
	res.redirect('/search/restaurants/' + req.body.query);
});

app.get('/search/restaurants/:query', function (req, res) {
	db.query('select * from restaurants where name like \'%' + req.params.query + '%\'', function (err, rows) {
		res.render('searchresults', {
			query: req.params.query,
			rows: rows
		});
	});
});

app.get('/restaurant/:id', function (req, res) {
	var query = 'select * from restaurants where id=' + req.params.id + ' order by id asc limit 1;';
	async.waterfall([
		(cb) => { db.query(query, cb); },
		(rows, fields, cb) => {
			var rest = rows[0];
			forecast.get([rest.lat, rest.long], (err, weather) => {
				if (err) return cb(err);
				else return cb(null, {
					restaurant: rest,
					weather: weather
				});
			});
		}
	], (err, results) => {
		if (err) {
			console.error(err);
			return res.sendStatus(500);
		} else res.render('restaurant', results);
	});
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
