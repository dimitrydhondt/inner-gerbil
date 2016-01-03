var PATH_TO_FILE = 'data/users_2015-12-27.csv';
var PATH_TO_MSGS_FILE = 'data/messages_2015-12-27.csv'
var importer = require('./importer.js');
var importUsers = require('./importUsers.js');
var importUser = importUsers.addUserToParty;
var importMessage = require('./importMessages.js');

hrefs = {
  PARTY_LETSDENDERMONDE: '/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849'
}
importer(process.cwd() + '/' + PATH_TO_FILE, function (user) {
  return importUser(user, hrefs.PARTY_LETSDENDERMONDE);
});
importer(process.cwd() + '/' + PATH_TO_MSGS_FILE, function (message) {
  return importMessage(message, hrefs.PARTY_LETSDENDERMONDE);
});
