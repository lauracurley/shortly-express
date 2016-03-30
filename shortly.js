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
var bcrypt = require('bcrypt-nodejs');



var app = express();

var auth = {};
auth.login = function(req, res, next) {
  // console.log("IS THERE A SESSION?");
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
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
  resave: false,
  saveUninitialized: true

}));

app.get('/', 
function(req, res, next) {
  // console.log('In get index');
  auth.login(req, res, next);
  // some logic

  res.send(200);
  res.render('index');
});

app.get('/create', 
function(req, res, next) {
  auth.login(req, res, next);
  res.send(200);
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
  var username = req.body.username;
  var password = req.body.password;
  // console.log("SELECTED", db.knex.select().table('users'));
  new User({username: username})
    .fetch()
    .then(function(user) {
      if (!user) {
        bcrypt.hash(password, null, null, function(err, hash) {
          if (err) {
            throw err;
          }
          Users.create({
            username: username,
            password: hash
          }).then(function(user) {
            return req.session.regenerate(function() {
              req.session.user = user;
              res.redirect('/');
            });
          });
        });
      } else {
        console.log('Username is already taken! Try again fool');
        res.redirect('/signup');
      }
    });
  // res.send(200);
});
/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username })
    .fetch()
    .then(function(user) {
      if (!user) {
        res.redirect('/signup');
      } else {
        bcrypt.compare(password, user.get('password'), function(err, match) {
          if (match) {
            return req.session.regenerate(function() {
              req.session.user = user;
          
              res.redirect('/');
            });

          } else {
            res.redirect('/login');
          }
        });
      }
    });
});



app.get('/login', function(req, res) {
  // res.send(200);
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
