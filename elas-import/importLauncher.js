// Generate new data files with data/elas2inner.py script based on an SQL dump
// e.g. ./elas2inner.py createCSV tmp/elasmechelen-20151102.sql .
var PATH_TO_USERS_FILE = 'data/tmpusers__2016-04-05.csv';
var PATH_TO_MSGS_FILE = 'data/tmpmessages__2016-04-05.csv';
var PATH_TO_TRXNS_FILE = 'data/tmptransactions__2016-04-05.csv';
var common = require('../js/common.js');
var info = common.info;
var error = common.error;
var importer = require('./importer.js');
var importUsers = require('./importUsers.js');
//var importUser = importUsers.addUserToParty;
var importMessage = require('./importMessages.js');
var importTransaction = require('./importTransactions.js');

var hrefs = {
  PARTY_LETSDENDERMONDE: '/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849'
};
return importer(process.cwd() + '/' + PATH_TO_USERS_FILE, function (user) {
  'use strict';
  var groupAlias = 'LM';
  return importUsers.addUserToGroup(user, groupAlias);
}).then(function () {
  'use strict';
  return importer(process.cwd() + '/' + PATH_TO_MSGS_FILE, function (message) {
    return importMessage(message, hrefs.PARTY_LETSDENDERMONDE);
  });
}).then(function () {
  'use strict';
  return importer(process.cwd() + '/' + PATH_TO_TRXNS_FILE, function (transaction) {
    var groupAlias = 'LM';
    return importTransaction(transaction, groupAlias);
  });
}).then(function () {
  'use strict';
  info('completed');
}).catch(function () {
  'use strict';
  error('Import failed... Is server running?');
}).done();
