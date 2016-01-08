/*eslint-env node*/
var moment = require('moment');
var common = require('../test/common.js');
var Q = require('q');
var deferred = Q.defer();

var port = 5000;
var base = 'http://localhost:' + port;

var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;

var importUsers = require('./importUsers.js');
var checkPartyExists = importUsers.checkPartyExists;

function debug(x) {
  console.log(x); // eslint-disable-line
}

exports = module.exports = function (trxn, groupAlias) {
  'use strict';
  var uuid = common.generateUUID();
  var fromAlias = groupAlias + '-' + trxn.id_from;
  var toAlias = groupAlias + '-' + trxn.id_to;
  debug('Checking party with alias ' + fromAlias + ' exists');
  var fromPartyHrefGlobal = '';
  var toPartyHrefGlobal = '';

  return checkPartyExists(base + '/parties?alias=' + fromAlias).then(function (partyUrl) {
    if (!partyUrl) {
      debug('Party with fromAlias ' + fromAlias + ' does not exist');
      throw 'From party (' + fromAlias + ')does not exist, import users first';
    } else {
      debug('Party with fromAlias ' + fromAlias + ' already exists with url ' + partyUrl);
      fromPartyHrefGlobal = partyUrl;
      return partyUrl;
    }
  }).then(function (fromPartyHref) {
    return checkPartyExists(base + '/parties?alias=' + toAlias).then(function (partyUrl) {
      if (!partyUrl) {
        debug('Party with toAlias ' + toAlias + ' does not exist');
        throw 'To party (' + toAlias + ') does not exist, import users first';
      } else {
        debug('Party with toAlias ' + toAlias + ' already exists with url ' + partyUrl);
        toPartyHrefGlobal = partyUrl;
        return partyUrl;
      }
    });
  }).then(function (toPartyHref) {
    var transaction = {
      from: {
        href: fromPartyHrefGlobal
      },
      to: {
        href: toPartyHrefGlobal
      },
      amount: trxn.amount,
      description: trxn.description
    };
    var putUrl = base + '/transactions/' + uuid;
    debug('Importing transaction ' + JSON.stringify(transaction) + ' with URL ' + putUrl);

    return doPut(putUrl, transaction, 'annadv', 'test')
      .then(function (responsePut) {
          if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201) {
            var errorMsg = 'PUT failed, response = ' + responsePut.statusCode;
            //var errorMsg = 'PUT failed, response = ' + JSON.stringify(responsePut);
            console.log(errorMsg);
            throw Error(errorMsg);
          }
          console.log('PUT to transactions successful (body=' + JSON.stringify(transaction) + ')');
        },
        function (err) {
          console.log('Batch PUT failed');
          throw err;
        });
  });
};
