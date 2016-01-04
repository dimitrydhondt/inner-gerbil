// Generate new data files with data/elas2inner.py script based on an SQL dump
// e.g. ./elas2inner.py createCSV tmp/elasmechelen-20151102.sql .
var PATH_TO_USERS_FILE = 'data/users__2016-01-03.csv';
var PATH_TO_MSGS_FILE = 'data/messages__2016-01-03.csv'
var importer = require('./importer.js');
var importUsers = require('./importUsers.js');
var importUser = importUsers.addUserToParty;
var importMessage = require('./importMessages.js');

hrefs = {
  PARTY_LETSDENDERMONDE: '/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849'
}
importer(process.cwd() + '/' + PATH_TO_USERS_FILE, function (user) {
  var groupAlias = 'LM';
  return importUsers.addUserToGroup(user, groupAlias);
  //  return importUser(user, hrefs.PARTY_LETSDENDERMONDE, groupAlias);
});
importer(process.cwd() + '/' + PATH_TO_MSGS_FILE, function (message) {
  return importMessage(message, hrefs.PARTY_LETSDENDERMONDE);
});
