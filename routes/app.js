//Config stuff
var http = require('http');
var url = require('url');
var moment = require('moment');
var fs = require('fs');
var localConfig = require('../config');
var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/'+localConfig.db);

var noFunc = function(){};

function Session(req,res) {
	this.req = req;
	this.res = res;
}

Session.prototype.fail = function(data) {
	console.error("Assets App: Error ("+this.req.connection.remoteAddress+")");
	console.error(data.message);
	data.status = "failure";
	this.res.type("json").status(data.code).write(JSON.stringify(data));
	this.res.end();
}

Session.prototype.success = function(data) {
	console.log("Assets App: Success ("+this.req.connection.remoteAddress+")");
	data.status = "success";
	this.res.type("json").write(JSON.stringify(data));
	this.res.end();
}

Session.prototype.handle = function(err,data,proceed) {
	if (!err) {
		if (proceed) {
			proceed(data);
		}
	} else {
		this.fail({message:err,code:500});
	}
}

//Supporting classes

var userSchema = new Schema({
  email: {type:String,required:true},
  password: {type:String,required:true},
  permissions: {type:String,required:true}
},{
	collection:'users'
})

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

var User = mongoose.model('User',userSchema);

//Application controller
var mongo = require('mongodb');
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

function Ctrl(host, port) {
	var that = this;
	this.kpis = [];
	this.db = new Db(localConfig.db, new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
	this.db.open(function(err, db) {
		if (err) {
			console.error("Assets App: Error: "+err);
		}
	    var Grid = require('gridfs-stream');
	    Grid.mongo = mongoose.mongo;

	    that.gfs = Grid(db);
	})
}

Ctrl.prototype.MOID = function(id) {
	return mongo.ObjectID(id);
}

Ctrl.prototype.createUser = function(req,res) {
	 User.findOne({ 'email' :  req.body.email }, function(err, user) {
		if (err) { req.flash('createMessage', 'Unable to save a new user account at this time.'); };
		if (user) {
		    req.flash('createMessage', 'There is already an account associated with that email address.');
		    res.redirect("/users");
		} else {
			var newUser = new User();
			newUser.email = req.body.email;
			newUser.permissions = req.body.permissions;
			newUser.password = newUser.generateHash(req.body.password);
			newUser.save(function(err) {
                if (err) {
                	req.flash('createMessage', 'Unable to save a new user account at this time.');
                }
                res.redirect("/users");
            })
       	}
   	})
}

Ctrl.prototype.updateUser = function(req,res) {
	User.findOne({ 'email' :  req.params.email }, function(err, user) {
		if (err) { req.flash('editMessage', 'Unable to edit that user account at this time.'); };
		if (user) {
			user.permissions = req.body.permissions;
			if (req.body.password && req.body.password.length > 0) {
				user.password = user.generateHash(req.body.password);
			}
			user.save(function(err) {
                if (err) {
                	req.flash('editMessage', 'Unable to edit that user account at this time.');
                }
                res.redirect("/users");
            })
		} else {
			req.flash('editMessage', 'There is no user account associated with that email address.');
		    res.redirect("/users");
       	}
   	})
}

Ctrl.prototype.deleteUser = function(req,res) {
	User.findOne({ 'email' :  req.params.email }, function(err, user) {
		if (err) { req.flash('deleteMessage', 'Unable to delete that user account at this time.'); };
		if (user) {
			user.remove(function(err) {
                if (err) {
                	req.flash('deleteMessage', 'Unable to delete that user account at this time.');
                }
                res.redirect("/users");
            })
		} else {
			req.flash('deleteMessage', 'There is no user account associated with that email address.');
		    res.redirect("/users");
       	}
   	})
}

Ctrl.prototype.getUsers = function(callback) {
	var ctrl = this;
	ctrl.db.collection("users", {strict:true}, function(err,collection) {
		if (!err) {
			 collection.find().toArray(function(err,result) {
			 	if (!err) {
			 		callback && callback(result);
			 	} else {
			 		callback && callback([]);
			 	}
			 })
		} else {
			callback && callback([]);
		}
	})
}

Ctrl.prototype.getUser = function(email,callback) {
	User.findOne({email:email}, function(err, user) {
		if (!err) {
			callback(user);
		} else {
			callback(undefined);
		}
   	})
}


exports.Ctrl = Ctrl;
exports.User = User;
