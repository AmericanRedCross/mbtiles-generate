//General config
var flash = require('connect-flash');
var localConfig = require('./config');
var AppCtrl = require('./routes/app').Ctrl;
var Asset = require('./routes/app').Asset;
var moment = require('moment');

var ctrl = new AppCtrl('localhost', 27017);


//Passport config
var User = require('./routes/app').User;
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use('local-login',new LocalStrategy({
		usernameField:"email",
		passwordField:"password",
		passReqToCallback:true
	},
	function(req, email, password, done) {
        User.findOne({ 'email' :  email }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user || !user.validPassword(password)) {
                return done(null, false, req.flash('loginMessage', 'Invalid username or password.'));
            }
            return done(null, user);
        });

    }
))

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//Express config
var express = require('express');
var exphbs  = require('express-handlebars');
var multer  = require('multer');
var morgan  = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();

app.use(morgan('dev'));     /* 'default', 'short', 'tiny', 'dev' */
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(multer());
app.use(cookieParser());
app.use(session({
  secret: 'thisissecret',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.engine('handlebars', exphbs({
	defaultLayout: 'main',
	helpers: {
		eq: function(v1,v2,options) {
			if (v1 && v2 && v1.toString() === v2.toString()) {
				return options.fn(this);
			}
			return options.inverse(this);
		},
		log: function(context,options) {
			console.log(context);
			return true;
		},
		json: function(context) {
			return JSON.stringify(context);
		},
		string: function(context) {
			return context.toString();
		},
		formatDate: function(context,format) {
			return moment(context).format(format);
		}
	},
	partials: {

	}
}))
app.set('view engine', 'handlebars');

app.use(express.static('client'));

app.post('/user/logout',function(req,res) {
	req.session.destroy(function() {
		res.redirect("/");
	})
})

app.post('/user/login',passport.authenticate('local-login', {
    failureRedirect: '/',
    failureFlash: true
}),function(req,res) {
	if (req.session.redirectTo) {
		res.redirect(req.session.redirectTo);
		delete req.session.redirectTo;
	} else {
		res.redirect("/");
	}
})

app.post('/user/:email',function(req,res) {
	if (req.user && req.user.permissions == "super") {
		switch(req.body["_method"]) {
			case "DELETE":
				ctrl.deleteUser(req,res);
			break;
			case "PUT":
				ctrl.updateUser(req,res);
			break;
			default:
				res.redirect("/");
			break;
		}
	} else {
		res.redirect("/");
	}
})

app.post('/user',function(req,res) {
	if (req.user && req.user.permissions == "super") {
		ctrl.createUser(req,res);
	} else {
		res.redirect("/");
	}
})

app.get('/users',function(req,res) {
	if (req.user && req.user.permissions == "super") {
		ctrl.getUsers(function(result) {
			res.render('listUsers',{
				user:req.user,
				users:result,
				opts:localConfig,
				error:req.flash("createMessage") || req.flash("editMessage") || req.flash("deleteMessage"),
				edit:req.query.edit
			});
		})
	} else {
		req.session.redirectTo = "/users";
		res.redirect("/");
	}
})

app.get('/api/user/:email',function(req,res) {
	if (req.user && req.user.permissions == "super") {
		ctrl.getUser(req.params.email,function(user) {
			res.json({email:user.email,permissions:user.permissions});
		})
	} else {
		res.redirect("/");
	}
})


app.get('/',function (req,res) {
	res.render('home',{
		user:req.user,
		opts:localConfig,
		error:req.flash("loginMessage")
	});
})

app.get('/map',function(req,res) {
	if (req.user) {
		// ctrl.getAssets(req.user,function(result) {
			res.render('map',{
				user:req.user,
				// assets:result,
				opts:localConfig,
				error:req.flash("createMessage") || req.flash("editMessage") || req.flash("deleteMessage"),
				edit:req.query.edit
			});
		// })
	} else {
		req.session.redirectTo = "/map";
		res.redirect("/");
	}
})

app.post('/map',function(req,res) {

	// need to grab the coordinates and name from the request box
	// and feed them into the ls variable
	// replace the ESRI server with the HOT tile server
	// in mongo save the name, bbox, generation start time, generation end time: null (or 'in-progress' tag)
	// monitor the process
	// log when completed
	// save (or move?) the mbtiles file somewhere else (amazon s3?)
	// in mongo update the entry with file size, generation end time  (change/remove 'in-progress' tag if used)

	var spawn = require('child_process').spawn

	console.log(req.route);

	/*
	var ls    = spawn('tl', ['copy', '-z', '13', '-Z', '14', '-b', '-16.977481842041012 14.752141311434283 -16.89044952392578 14.818034430867115', 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 'mbtiles://./test.mbtiles']);

	ls.stdout.on('data', function (data) {
	  console.log('stdout: ' + data);
		// example data:  14/7420/7510	5783
	});

	ls.stderr.on('data', function (data) {
	  console.log('stderr: ' + data);
	});

	ls.on('close', function (code) {
	  console.log('child process exited with code ' + code);
	});
	*/

});



app.listen(8888);
console.log('Listening on port 8888');
