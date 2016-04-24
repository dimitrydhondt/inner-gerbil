// Generate new data files with data/elas2inner.py script based on an SQL dump
// e.g. ./elas2inner.py createCSV tmp/elasmechelen-20151102.sql .
//var PATH_TO_MSGS_FILE = 'data/tmpmessages__2016-04-05.csv';
var PATH_TO_MSGS_FILE = 'data/messages__short.csv';
var common = require('../js/common.js');
var info = common.info;
var error = common.error;
var importer = require('./importer.js');
var importMessage = require('./importMessages.js');
var lookupGroup = require('./importUsers.js').checkPartyWithAliasExists;

var groupAlias = 'LM';
var groupHref;
info('import of messages started');

return lookupGroup(groupAlias).then(function (groupExists) {
  'use strict';
  if (!groupExists) {
    throw new Error('Party with alias ' + groupAlias + ' could not be found');
  }
  groupHref = groupExists;
  return importer(process.cwd() + '/' + PATH_TO_MSGS_FILE, function (message) {
    info('Importing message \'' + message.content + '\' to groupHref ' + groupHref);
    return importMessage(message, groupHref);
  });
}).then(function () {
  'use strict';
  info('completed');
}).catch(function (err) {
  'use strict';
  error('Import failed... Is server running? (error: ' + err + ')');
}).done();
