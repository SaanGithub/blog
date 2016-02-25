var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
var sequelize = new Sequelize('blog', 'postgres', null, {
	host: 'localhost',
	dialect: 'postgres',
	define: {
		timestamps: false
	}
});


// define tables

var User = sequelize.define('user', {
	name: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING
});

var Post = sequelize.define('post', {
	userid: Sequelize.INTEGER,
	title: Sequelize.STRING,
	body: Sequelize.TEXT,

});

var Comment = sequelize.define('comment', {
	postid: Sequelize.INTEGER,
	message: Sequelize.TEXT,
	name: Sequelize.TEXT
});

// define relationships

User.hasMany(Post);
Post.belongsTo(User);

Post.hasMany(Comment);
Comment.belongsTo(Post);

app.use(session({
	secret: 'oh wow very secret much security',
	resave: true,
	saveUninitialized: false
}));

app.set('views', './src/views');
app.set('view engine', 'jade');


// register/login user 

app.get('/', function(request, response) {
	response.render('index', {
		message: request.query.message,
		user: request.session.user
	});
});

app.post('/users/new', bodyParser.urlencoded({
	extended: true
}), function(request, response) {
	User.create({
		email: request.body.email,
		password: request.body.password
	});
});

app.get('/users/:id', function(request, response) {
	var user = request.session.user;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
	} else {
		response.render('users/profile', {
			user: user
		});
	}
});

app.post('/login', bodyParser.urlencoded({
	extended: true
}), function(request, response) {
	User.findOne({
		where: {
			email: request.body.email
		}
	}).then(function(user) {
		if (user !== null && request.body.password === user.password) {
			request.session.user = user;
			response.redirect('users/' + user.id);
		} else {
			response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
		}
	}, function(error) {
		response.redirect('/?message=' + encodeURIComponent("Invalid email or password.2"));
	});
});

app.get('/logout', function(request, response) {
	request.session.destroy(function(error) {
		if (error) {
			throw error;
		}
		response.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
	})
});

// create/get posts

app.post('/posts/new', bodyParser.urlencoded({
	extended: true
}), function(request, response) {


	Post.create({
		userid: request.session.user.id,
		title: request.body.titleswag,
		body: request.body.bodyswag
	});
	Post.findAll().then(function(posts) {
		var data = posts.map(function(post) {
			return {
				userid: post.dataValues.userid,
				title: post.dataValues.title,
				body: post.dataValues.body
			};
		})
		console.log("somethingelse");
		response.render('posts', {
			data: data

		});
	})
});


app.get('/posts/:id', function(request, response) {
	var user = request.session.user;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your posts."));
	} else {

		Post.findAll().then(function(posts) {

			var data = posts.map(function(post) {
				return {

					userid: post.dataValues.userid,
					title: post.dataValues.title,
					body: post.dataValues.body
				};
			})

			console.log("something");
			response.render('posts', {
				data: data,
				user: request.session.user
			});
		})
	}
});


// Post.findAll().then(function (posts) {
// 	var data = posts.map(function (post) {
// 		return {
// 			title: post.dataValues.title,
// 			body: post.dataValues.body
// 		};
// 	});

// 	console.log("printing results:");
// 	console.log(data);});

// verzamel data
// conditie
// verzamel data
// redirect

sequelize.sync().then(function() {
	var server = app.listen(3000, function() {
		console.log('Example app listening on port: ' + server.address().port);
	});
});

// Add alerts
// Comment section
//