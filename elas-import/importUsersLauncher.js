// Generate new data files with data/elas2inner.py script based on an SQL dump
// e.g. ./elas2inner.py createCSV tmp/elasmechelen-20151102.sql .
var PATH_TO_USERS_FILE = 'data/tmpusers__2016-04-05.csv';
var common = require('../js/common.js');
var info = common.info;
var error = common.error;
var importer = require('./importer.js');
var importUsers = require('./importUsers.js');


var lookupGroup = require('./importUsers.js').checkPartyWithAliasExists;

var groupAlias = 'LM';
var groupHref;
info('import of messages started');

return lookupGroup(groupAlias).then(function (groupExists) {
  'use strict';
  if (!groupExists) {
    return importUsers.createGroup(groupAlias);
  }
  return groupExists;
}).then(function (groupHrefReturned) {
  'use strict';
  groupHref = groupHrefReturned;
  return importer(process.cwd() + '/' + PATH_TO_USERS_FILE, function (user) {
    info('Importing user \'' + user.letscode + '\' to groupHref ' + groupHref);
    return importUsers.addUserToParty(user, groupHref, groupAlias);
  });
}).then(function () {
  'use strict';
  info('completed');
}).catch(function (err) {
  'use strict';
  error('Import failed... Is server running? (error: ' + err + ')');
}).done();
