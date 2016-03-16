var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
var fs = require('fs');

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
	userId: Sequelize.INTEGER,
	title: Sequelize.STRING,
	body: Sequelize.TEXT,
	author: Sequelize.STRING

});

var Comment = sequelize.define('comment', {
	postId: Sequelize.INTEGER,
	body: Sequelize.TEXT,
	author: Sequelize.STRING
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
		post: request.query.post,
		message: request.query.message,
		user: request.session.user
	});
});

app.post('/users', bodyParser.urlencoded({
	extended: true
}), function(request, response) {
	User.create({
		name: request.body.name,
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
		response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
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


app.post('/posts/', bodyParser.urlencoded({
	extended: true
}), function(request, response) {
	var user = request.session.user;

	Post.create({
		userId: request.session.user.id,
		title: request.body.titleswag,
		body: request.body.bodyswag,
		author: request.session.user.name
	})
	response.redirect('users/' + user.id + '/posts');
});


app.get('/users/:id/posts', function(request, response) {
	var user = request.session.user;
	var id = request.session.user.id;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your posts."));
	} else {

		Post.findAll().then(function(posts) {
				var data = posts.map(function(post) {
					return {

						userId: post.dataValues.userId,
						title: post.dataValues.title,
						body: post.dataValues.body,
						author: post.dataValues.author,
						id: post.dataValues.id

					};
				})
				allPosts = data;
			}).then(

				function findYourPosts() {

					yourPosts = [];

					for (i = 0; i < allPosts.length; i++) {
						if (allPosts[i].userId === id) {
							yourPosts.push(allPosts[i]);
						}
					}
				}
			)
			.then(function() {
				response.render('posts', {
					allPosts: allPosts,
					yourPosts: yourPosts,
					user: request.session.user
				});
			})
	}
});

app.get('/comments/users/:id/posts/:postid/', function(request, response) {
	var user = request.session.user;
	idpost = request.params.postid;
	var id = request.session.user.id;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your posts."));
	} else {

		Post.findAll().then(function(posts) {
			var data = posts.map(function(post) {
				return {

					userId: post.dataValues.userId,
					title: post.dataValues.title,
					body: post.dataValues.body,
					author: post.dataValues.author,
					id: post.dataValues.id

				}
			})
			allPosts = data;
		}).then(

			function findComments() {

				commentPosts = [];

				for (i = 0; i < allPosts.length; i++) {
					if (allPosts[i].id == idpost) {
						commentPosts.push(allPosts[i]);
					}
				}
			}
		)

		Comment.findAll().then(function(posts) {
			var data = posts.map(function(post) {

				return {
					author: post.dataValues.author,
					body: post.dataValues.body,
					postId: post.dataValues.postId
				}
			})
			Comments = data;

		})

		.then(
			function findPostComments() {
				postComments = [];
				for (i = 0; i < Comments.length; i++) {
					if (Comments[i].postId == idpost) {
						postComments.push(Comments[i]);
					}

				}

			})

		.then(function() {

			response.render('comments', {
				allPosts: allPosts,
				commentPosts: commentPosts,
				postComments: postComments,
				user: request.session.user,
				idpost: idpost

			});
		})
	}
});

app.post('/comments', bodyParser.urlencoded({
	extended: true
}), function(request, response) {
	var user = request.session.user;
	Comment.create({
		postId: idpost,
		body: request.body.comment,
		author: request.session.user.name
	})
	response.redirect('users/' + user.id + '/posts/' + idpost);
});


sequelize.sync().then(function() {
	var server = app.listen(3000, function() {
		console.log('App listening on port: ' + server.address().port);
	});
});