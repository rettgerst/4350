var fs = require('fs');
var async = require('async');
var express = require('express');
var session = require('express-session');
var passport = require('passport');
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
var Forecast = require('forecast');
var config;
if (!fs.existsSync('config.js')) {
	console.log('please create configuration file config.js\nsee config-example.js for examples');
} else {
	config = require('./config.js');
}

var mailer = nodemailer.createTransport(require(config.transport)(config.transport_options));

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
	res.render('onepager');
});

app.post('/api/register', function (req, res) {
	passport.authenticate('local-register', (err, user/*, info*/) => {
		if (err) console.error(err);
		else {
			var email = {
				to: [user.email],
				from: 'Patio <patio@patio.rettgerst.website>',
				subject: 'Please confirm your account',
				text: 'http://' + config.host + '/api/confirm?code=' + user.code
			};

			mailer.sendMail(email, function(err, res) {
				if (err) {
					console.log(err) ;
				}
				console.log(res);
			});
			return res.redirect('/');
		}
	})(req, res);
});

app.get('/api/confirm', function (req, res) {
	if (typeof parseInt(req.query.code) !== 'number') return res.sendStatus(500);
	var query = 'update users set confirmed=true, code=\'\' where code=\'' + req.query.code + '\';';
	db.query(query, function (err) {
		if (err) return res.sendStatus(500);
		else return res.redirect('/');
	});
});

app.post('/api/login', passport.authenticate('local-login'), function (req, res) {
	return res.sendStatus(200);
});

app.post('/api/whoami', function (req, res) {
	if (req.user) {
		var userCopy = JSON.parse(JSON.stringify(req.user));
		delete userCopy.pass_md5_hex;
		return res.json(userCopy);
	} else {
		return res.sendStatus(500);
	}
});

app.post('/api/getReservations', function (req, res) {
	if (req.user) {
		db.query('select reservations.id, name, number, restaurant as restaurant_id, UNIX_TIMESTAMP(reservations.time) as unix_time from reservations inner join restaurants on reservations.restaurant=restaurants.id where user=' + req.user.id + ';', function (err, rows) {
			if (err) {
				console.error(err);
				return res.sendStatus(500);
			}
			else return res.json(rows);
		});
	} else {
		return res.sendStatus(500);
	}
});

app.post('/api/deleteReservation', function (req, res) {
	if (req.user) {
		var query = 'delete from reservations where id=' + parseInt(req.body.id) + ' and user=' + req.user.id + ';';
		db.query(query, function (err) {
			if (err) {
				console.error(err);
				return res.sendStatus(500);
			}
			else return res.sendStatus(200);
		});
	} else {
		return res.sendStatus(500);
	}
});

app.post('/api/logout', function (req, res) {
	req.session.destroy();
	return res.sendStatus(200);
});

app.get('/search/restaurants/:query', function (req, res) {
	db.query('select * from restaurants where name like \'%' + req.params.query + '%\' or cuisine like \'%' + req.params.query + '%\'', function (err, rows) {
		res.json(rows);
	});
});

app.post('/api/createReservation', function (req, res) {
	if (!req.user) return res.sensStatus(500);
	var restime = new Date(parseInt(req.body.time)).toISOString().slice(0, 19).replace('T', ' ');
	var query = 'insert into reservations (restaurant, user, number, time) values (' + parseInt(req.body.restaurant) + ', ' + parseInt(req.user.id) + ', ' + parseInt(req.body.number) + ', \'' + restime + '\');';
	db.query(query, function (err, result) {
		if (err) {
			console.error(err);
			return res.sendStatus(500);
		} else {
			var query = 'SELECT * FROM reservations INNER JOIN restaurants ON reservations.restaurant=restaurants.id WHERE reservations.id=' + result.insertId + ';';
			db.query(query, function (err, rows) {
				if (err) return console.error(err);
				var emailtext = 'You have a reservation at ' + rows[0].name + ' at ' + rows[0].time + ' for ' + rows[0].number + ' ' + ((rows[0].number > 1) ? 'people' : 'person') + '.';
				var gmapslink = 'https://www.google.com/maps/dir//' + rows[0].lat + ',' + rows[0].long;
				var emailhtml = '<p>' + emailtext + '</p><p><a href=\"' + gmapslink + '\">Click here for directions to ' + rows[0].name + '</a></p>';
				var email = {
					to: [req.user.email],
					from: 'Patio <patio@patio.rettgerst.website>',
					subject: 'Reservation at ' + rows[0].name,
					html: emailhtml
				};

				mailer.sendMail(email, function(err, res) {
					if (err) {
						console.log(err) ;
					}
					console.log(res);
				});
			});
			res.sendStatus(200);
		}
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
		} else res.json(results);
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
