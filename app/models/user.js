var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  username: '',
  password: ''//,

  // initialize: function() {
  //   this.on('creating', function(model, attrs, options) {
  //     var shasum = bcrypt.createHash('sha1');
  //     shasum.update(model.get('url'));
  //     model.set('code', shasum.digest('hex').slice(0, 5));
  //   });
  // }
});

module.exports = User;