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
var doGet = sriclient.get;
var doPut = sriclient.put;

var importUsers = require('./importUsers.js');
var checkPartyWithAliasExists = importUsers.checkPartyWithAliasExists;
var stringify = require('json-stringify-safe');
var generateUUID = require('../test/common.js').generateUUID;

var checkTransactionExists = function (transaction) {
  'use strict';
  var errorMsg;
  var queryUrl = base + '/transactions?amount=' + transaction.amount + '&description=' + transaction.description
  + '&from=' + transaction.from.href + '&to=' + transaction.to.href;
  info('checking if message exist with query: ' + queryUrl);
  return doGet(queryUrl, 'annadv', 'test').then(function (getResponse) {
    if (getResponse.statusCode !== 200) {
      errorMsg = 'GET failed, response = ' + stringify(getResponse);
      error(errorMsg);
      throw new Error(errorMsg);
    }
    var getBody = getResponse.body;
    if (getBody.$$meta.count === 0) {
      return false;
    }
    if (getBody.$$meta.count > 1) {
      throw new Error('Multiple transactions already exists');
    }
    return getBody.results[0].href;
  });
};

var createUpdateTransaction = function (transaction) {
  'use strict';
  var errorMsg;
  var trxnHref;
  info('Importing transaction ' + stringify(transaction));

  return checkTransactionExists(transaction).then(function (trxnExists) {
    var uuid;
    var putUrl;
    info('checkTransactionExists returned ' + trxnExists);
    if (trxnExists !== false) {
      trxnHref = trxnExists;
      info('transactions ' + trxnHref + ' already exists -> to be skipped (' + transaction.description + ')');
      return 'transaction already exists' + stringify(transaction);
    }
    // Transaction needs to be created -> generate UUID
    uuid = generateUUID();
    trxnHref = '/messages/' + uuid;
    info('transactions ' + trxnHref + ' will be created (' + transaction.description + ')');
    putUrl = base + '/transactions/' + uuid;
    return doPut(putUrl, transaction, 'annadv', 'test').then(function (responsePut) {
        // 200: OK; 201: Created; 403: unauthorized (thrown when request is converted to an update)
        if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201 && responsePut.statusCode !== 403) {
          errorMsg = 'PUT failed, response = ' + responsePut.statusCode;
          //var errorMsg = 'PUT failed, response = ' + JSON.stringify(responsePut);
          error(errorMsg);
          throw new Error(errorMsg);
        }
        debug('PUT to transactions successful (body=' + JSON.stringify(transaction) + ')');
      },
      function (err) {
        error('Batch PUT failed' + stringify(err));
        throw err;
      });
  });
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
  if (typeof trxn.cdate === 'undefined') {
    return false;
  }
  return true;
};

exports = module.exports = function (trxn, groupHref, groupAlias) {
  'use strict';
  if (!validTrxn(trxn)) {
    warn('invalid transaction - missing mandatory (id_from, id_to, amount or cdate) for ' + JSON.stringify(trxn));
    return Q.fcall(function () {
      throw new Error('Invalid transaction');
    });
  }
  var fromAlias = groupAlias + '-' + trxn.id_from;
  var toAlias = groupAlias + '-' + trxn.id_to;
  debug('Checking party with alias ' + fromAlias + ' exists');
  var fromPartyHrefGlobal = '';
  var toPartyHrefGlobal = '';

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
        info('Party with toAlias ' + toAlias + ' does not exist');
        throw new Error('\'To\' party (' + toAlias + ') does not exist, import users first');
      } else {
        info('Party with toAlias ' + toAlias + ' already exists with url ' + partyUrl);
        toPartyHrefGlobal = partyUrl;
        return partyUrl;
      }
    });
  }).then(function () {
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
    info('start create/update of transaction' + stringify(transaction));
    return createUpdateTransaction(transaction);
  }).catch(function (e) {
    error('importTransaction failed with error ' + e);
    throw e;
  });
};
