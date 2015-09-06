/* Configuration for sri4node, used for our server.js, but also for mocha tests */
var Q = require('q');
var common = require('./common.js');
var cl = common.cl;
var knownIdentities = {};
var knownPasswords = {};

exports = module.exports = function (sri4node, verbose) {
  'use strict';
  var $u = sri4node.utils;

  var myAuthenticator = function (db, username, password) {
    var deferred = Q.defer();
    var q;

    if (knownPasswords[username]) {
      if (knownPasswords[username] === password) {
        deferred.resolve(true);
      } else {
        deferred.resolve(false);
      }
    } else {
      q = $u.prepareSQL('select-count-from-persons-where-email-and-password');
      q.sql('select count(*) from parties where login = ').param(username).sql(' and password = ').param(password);
      $u.executeSQL(db, q).then(function (result) {
        var count = parseInt(result.rows[0].count, 10);
        if (count === 1) {
          // Found matching record, add to cache for subsequent requests.
          knownPasswords[username] = password;
          deferred.resolve(true);
        } else {
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
    var parentsquery;

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
        messages: '/messages?postedByParties=/parties/' + row.key,
        transaction: '/transactions?involvingParties=/parties/' + row.key,
        contactdetails: '/contactdetails?forParties=/parties/' + row.key
      };
      if (ret.imageurl === null) {
        delete ret.imageurl;
      }
      if (ret.alias === null) {
        delete ret.alias;
      }
      parentsquery = $u.prepareSQL('my-parents');
      parentsquery.sql('select key from parties where 1=1');
      common.parentsOf($u)('/parties/' + row.key, parentsquery);
      return $u.executeSQL(database, parentsquery);
    }).then(function (result) {
      ret.parents = [];
      result.rows.forEach(function (parentrow) {
        ret.parents.push('/parties/' + parentrow.key);
      });
    }).then(function () {
      deferred.resolve(ret);
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

  return {
    authenticate: $u.basicAuthentication(myAuthenticator),
    identify: getMe,

    logrequests: true,
    logsql: verbose,
    logdebug: verbose,
    defaultdatabaseurl: 'postgres://gerbil:inner@localhost:5432/postgres',
    resources: [
      require('./contactdetails')(sri4node, extraResourceConfig),
      require('./parties')(sri4node, extraResourceConfig),
      require('./partyrelations')(sri4node, extraResourceConfig),
      require('./partycontactdetails')(sri4node, extraResourceConfig),
      require('./transactions')(sri4node, extraResourceConfig),
      require('./transactionrelations')(sri4node, extraResourceConfig),
      require('./messages')(sri4node, extraResourceConfig),
      require('./messagecontactdetails')(sri4node, extraResourceConfig),
      require('./messageparties')(sri4node, extraResourceConfig),
      require('./messagetransactions')(sri4node, extraResourceConfig),
      require('./messagerelations')(sri4node, extraResourceConfig),

      require('./plugins.js')(sri4node, extraResourceConfig),
      require('./pluginauthorisations.js')(sri4node, extraResourceConfig),
      require('./plugindata.js')(sri4node, extraResourceConfig),
      require('./pluginconfigurations.js')(sri4node, extraResourceConfig)
    ]
  };
};
