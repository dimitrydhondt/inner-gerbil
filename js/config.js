/* Configuration for sri4node, used for our server.js, but also for mocha tests */
var Q = require('q');
var bcrypt = require('bcrypt');
var common = require('./common.js');
var fs = require('fs');
var cl = common.cl;
var knownIdentities = {};
var hashCache = {};

exports = module.exports = function (sri4node, verbose) {
  'use strict';
  var $u = sri4node.utils;

 var saltedPasswordAuthenticator = function (db, username, password) {
      var deferred = Q.defer();
        var q;
        if (hashCache[username]) {
            if (bcrypt.compareSync(password, hashCache[username])) {
              cl('login succeed');
                deferred.resolve(true);
            } else {
              cl('login fail');
                deferred.resolve(false);
            }
        } else {
            q = $u.prepareSQL('select-count-from-persons-where-email-and-password');
            q.sql('select password from parties where login = ')
             .param(username)
             .sql(' and status = ')
             .param('active')
             .sql(' and "$$meta.deleted" <> true');
            $u.executeSQL(db, q).then(function (result) {
                var count = parseInt(result.rows.length, 10);
                if (count === 1) {
                    // Found matching record, add to cache for subsequent requests.
                    hashCache[username] = result.rows[0].password;
                    if (bcrypt.compareSync(password, hashCache[username])) {
                      cl('login succeed');
                        deferred.resolve(true);
                    } else {
                       cl('login fail');
                        deferred.resolve(false);
                    }
                }else {
                    deferred.resolve(false);
                }
            }).fail(function (err) {
                cl('Error checking user on database : ');
                cl(err);
                deferred.reject(err);
            });
        }
        return deferred.promise;
  };

  var identity = function (username, database) {
    var deferred = Q.defer();
    var row;
    var ret;
    var query;

    query = $u.prepareSQL('me');
    query.sql('select * from parties where login = ').param(username);
    $u.executeSQL(database, query).then(function (result) {
      row = result.rows[0];
      ret = {
        permalink: '/parties/' + row.key,
        login: row.login,
        name: row.name,
        alias: row.alias,
        dateofbirth: row.dateofbirth,
        imageurl: row.imageurl,
        messages: {href: '/messages?postedByParties=/parties/' + row.key},
        transactions: {href: '/transactions?involvingParties=/parties/' + row.key},
        contactdetails: {href: '/contactdetails?forParties=/parties/' + row.key},
        parents: {href: '/parties?ancestorsOfParties=/parties/' + row.key},
        partyrelations: {href: '/partyrelations?from=/parties/' + row.key}
      };
      if (ret.imageurl === null) {
        delete ret.imageurl;
      }
      if (ret.alias === null) {
        delete ret.alias;
      }
      deferred.resolve(ret);
    }).fail(function (error) {
      cl('Error retrieving /me for login [' + username + ']');
      cl(error);
      cl(error.stack);
      deferred.reject();
    });

    return deferred.promise;
  };

  var getMe = function (req, database) {
    var deferred = Q.defer();

    var basic = req.headers.authorization;
    var encoded = basic.substr(6);
    var decoded = new Buffer(encoded, 'base64').toString('utf-8');
    var firstColonIndex = decoded.indexOf(':');
    var username;

    if (firstColonIndex !== -1) {
      username = decoded.substr(0, firstColonIndex);
      if (knownIdentities[username]) {
        deferred.resolve(knownIdentities[username]);
      } else {
        identity(username, database).then(function (me) {
          knownIdentities[username] = me;
          deferred.resolve(me);
        }).fail(function (err) {
          cl('Retrieving of identity had errors. Removing pg client from pool. Error : ');
          cl(err);
          deferred.reject(err);
        });
      }
    }

    return deferred.promise;
  };


  var extraResourceConfig = {
    cacheconfig: {  
      ttl: 60,
      type: 'local'
    }
  };

  var description = fs.readFileSync(__dirname + '/api-description.html');

  return {
    authenticate: $u.basicAuthentication(saltedPasswordAuthenticator),
    identify: getMe,

    logrequests: true,
    logsql: verbose,
    logdebug: verbose,
    defaultdatabaseurl: 'postgres://gerbil:inner@localhost:5432/postgres',
    description: description,
    resources: [
      require('./parties')(sri4node, extraResourceConfig),
      require('./partyrelations')(sri4node, extraResourceConfig),
      require('./contactdetails')(sri4node, extraResourceConfig),
      require('./partycontactdetails')(sri4node, extraResourceConfig),
      require('./messages')(sri4node, extraResourceConfig),
      require('./messagecontactdetails')(sri4node, extraResourceConfig),
      require('./messageparties')(sri4node, extraResourceConfig),
      require('./messagetransactions')(sri4node, extraResourceConfig),
      require('./messagerelations')(sri4node, extraResourceConfig),
      require('./transactions')(sri4node, extraResourceConfig),
      require('./transactionrelations')(sri4node, extraResourceConfig),

      require('./plugins.js')(sri4node, extraResourceConfig),
      require('./pluginauthorisations.js')(sri4node, extraResourceConfig),
      require('./pluginconfigurations.js')(sri4node, extraResourceConfig),
      require('./plugindata.js')(sri4node, extraResourceConfig)
    ]
  };
};
