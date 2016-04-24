/*eslint-env node*/
var Q = require('q');

var common = require('../js/common.js');
var debug = common.debug;
var info = common.info;
var warn = common.warn;
var error = common.error;

var port = 5000;
var base = 'http://localhost:' + port;

var sriclient = require('sri4node-client');
var doPut = sriclient.put;

var importUsers = require('./importUsers.js');
var checkPartyWithAliasExists = importUsers.checkPartyWithAliasExists;
var commonImport = require('./common.js');
var stringify = require('json-stringify-safe');

var generateUUID = function (trxnId) {
  'use strict';
  var name = trxnId;
  var namespace = 'http://elas.vsbnet.be';
  if (trxnId.indexOf('@') > -1) {
    namespace = 'http://' + trxnId.substring(trxnId.indexOf('@'), trxnId.length);
  }
  return commonImport.generateUUIDv5FromName(namespace, name);
};

var validTrxn = function (trxn) {
  'use strict';
  if (typeof trxn.id_from === 'undefined') {
    return false;
  }
  if (typeof trxn.id_to === 'undefined') {
    return false;
  }
  if (typeof trxn.amount === 'undefined') {
    return false;
  }
  if (typeof trxn.transid === 'undefined') {
    return false;
  }
  return true;
};

exports = module.exports = function (trxn, groupAlias) {
  'use strict';
  if (!validTrxn(trxn)) {
    warn('invalid transaction - missing mandatory (id_from, id_to, amount or transid) for ' + JSON.stringify(trxn));
    return Q.fcall(function () {
      throw new Error('Invalid transaction');
    });
  }
  var fromAlias = groupAlias + '-' + trxn.id_from;
  var toAlias = groupAlias + '-' + trxn.id_to;
  debug('Checking party with alias ' + fromAlias + ' exists');
  var fromPartyHrefGlobal = '';
  var toPartyHrefGlobal = '';
  var errorMsg;

  return checkPartyWithAliasExists(fromAlias).then(function (partyUrl) {
    if (!partyUrl) {
      info('Party with fromAlias ' + fromAlias + ' does not exist');
      throw new Error('\'From\' party (' + fromAlias + ') does not exist, import users first');
    } else {
      info('Party with fromAlias ' + fromAlias + ' already exists with url ' + partyUrl);
      fromPartyHrefGlobal = partyUrl;
      return partyUrl;
    }
  }).then(function () {
    return checkPartyWithAliasExists(toAlias).then(function (partyUrl) {
      if (!partyUrl) {
        debug('Party with toAlias ' + toAlias + ' does not exist');
        throw new Error('\'To\' party (' + toAlias + ') does not exist, import users first');
      } else {
        debug('Party with toAlias ' + toAlias + ' already exists with url ' + partyUrl);
        toPartyHrefGlobal = partyUrl;
        return partyUrl;
      }
    });
  }).then(function () {
    return generateUUID(trxn.transid);
  }).then(function (uuid) {
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
          // 200: OK; 201: Created; 403: unauthorized (thrown when request is converted to an update)
          if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201 && responsePut.statusCode !== 403) {
            errorMsg = 'PUT failed, response = ' + responsePut.statusCode;
            //var errorMsg = 'PUT failed, response = ' + JSON.stringify(responsePut);
            error(errorMsg);
            throw Error(errorMsg);
          }
          debug('PUT to transactions successful (body=' + JSON.stringify(transaction) + ')');
        },
        function (err) {
          error('Batch PUT failed' + stringify(err));
          throw err;
        });
  });
};
