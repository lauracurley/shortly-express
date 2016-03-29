var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var session = require('express-session');


var app = express();

var auth = {};
auth.login = function(req, res, next) {
  // console.log("IS THERE A SESSION?");
  if (!session.secret) {
    res.redirect('/login');
  } else {
    next();
  }
  // res.statusCode(404);
  console.log('LOGIN and in and in');
  // res.redirect('/login'); 
  // next();
};
// auth.login();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'a4f8071f-c873-4447-8ee2',
  cookie: { maxAge: 2628000000 },
  resave: true,
  saveUninitialized: true
    // store: new (require('express-sessions'))({
    //     storage: 'sqlite3',
    //     host: '127.0.0.1', // optional 
    //     port: 4568, // optional 
    //     db: 'shortly.sqlite', // optional 
    //     collection: 'sessions', // optional 
    //     expire: 86400 // optional 
    // })
}));

app.get('/', 
function(req, res, next) {
  // console.log('In get index');
  auth.login(req, res, next);
  // some logic

  res.render('index');
});

app.get('/create', 
function(req, res, next) {
  auth.login(req, res, next);
  res.render('index');
});

app.get('/links', 
function(req, res, next) {
  // auth.login(req, res, next);
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

app.get('/signup', 
function(req, res, next) {
  res.render('signup');
});

app.post('/signup', 
function(req, res, next) {
  console.log('_____________', typeof req.body);
  // console.log("SELECTED", db.knex.select().table('users'));
  new User({
    'username': body.username,
    'password': body.password
  }).save().then(function() {
    console.log("SUCCESS");
    // res.send(201);
  });
  // db.knex('users')
  // .insert([{username: req.body.username}, {password: req.body.password}])
  // .asCallback( function(err, rows) {
  //   console.log('FINISHED INSERT', err);
    // res.send(201);
  // });
  // console.log('querying: ', db.knex('user').insert({username: 'laura'}).returning('*').toString());
  // console.log('Asyncing?');
  // db.knex.insert([{username: req.body.username}, {password: req.body.password}]).into('user', function(err) {
  //   console.log('FINISHED INSERT', err);
  // });

  res.send(200);
});
/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/login', function(req, res) {
  res.send(404);
});



app.get('/login', function(req, res){
  res.render('login');
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
