var crypto = require('crypto');
function md5hex (data) {
	return crypto.createHash('md5').update(data).digest("hex");
}
var LocalStrategy   = require('passport-local').Strategy;
module.exports = function(passport, db, cb) {
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		db.query('select * from users where id like ' + id + ';', (err, rows) => {
			done(err, rows[0]);
		});
	});

	passport.use('local-register', new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass back the entire request to the callback
	},
	function(req, email, password, done) {

		process.nextTick(function() {
			db.query('select * from users where email like \'' + email + '\';', (err, rows) => {
				if (err) return done(err);

				var user = rows[0];

				if (user) {
					return done(null, false, 'user with email already exists');
				} else {
					var newUser = {
						'email': email,
						'pass_md5_hex': md5hex(password),
						'code': Math.floor(Math.random()*89999+10000)
					};

					var query = 'insert into users (email, pass_md5_hex, code) values(\'' + newUser.email + '\', \'' + newUser.pass_md5_hex + '\', \'' + newUser.code + '\');';
					db.query(query, (err) => {
						if (err) throw err;
						else {
							return done(null, newUser, 'created new user');
						}
					});
				}
			});
		});
	}));

	passport.use('local-login', new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true
	},
	function(req, email, password, done) {
		db.query('select * from users where email like \'' + email + '\';', (err, rows) => {
			if (err) return done(err);

			var user = rows[0];

			if (!user) {
				return done(null, false, 'no user found');
			} else if (md5hex(password) !== user.pass_md5_hex) {
				return done(null, false, 'incorrect password');
			} else if (!user.confirmed) {
				return done(null, false, 'unconfirmed');
			} else {
				return done(null, user, 'login successful');
			}
		});

	}));

	return cb();

};

