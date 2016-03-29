var path = require('path');
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    host: '127.0.0.1',
    filename: path.join(__dirname, '../db/shortly.sqlite'),
    user: 'root',
    password: '',
    database: 'shortly.sqlite',
    charset: 'utf8'
  }
});
var db = require('bookshelf')(knex);

db.knex.schema.hasTable('urls').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('urls', function (link) {
      link.increments('id').primary();
      link.string('url', 255);
      link.string('baseUrl', 255);
      link.string('code', 100);
      link.string('title', 255);
      link.integer('visits');
      link.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('clicks').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('clicks', function (click) {
      click.increments('id').primary();
      click.integer('linkId');
      click.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

// knex.connection.connect();

/************************************************************/
// Add additional schema definitions below
/************************************************************/
db.knex.schema.hasTable('user').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('user', function (link) {
      link.increments('id').primary();
      link.string('username', 255);
      link.string('password', 255);
      link.string('salt', 255);
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});



module.exports = db;
