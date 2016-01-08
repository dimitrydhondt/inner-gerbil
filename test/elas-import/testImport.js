/*eslint-env node, mocha */
var path = require('path');
var Q = require('q');
var deferred = Q.defer();
var importer = require('../../elas-import/importer.js');
var importUsers = require('../../elas-import/importUsers.js');
var importUser = importUsers.addUserToParty;
var checkPartyExists = importUsers.checkPartyExists;
var importMessage = require('../../elas-import/importMessages.js');
var importTransactions = require('../../elas-import/importTransactions.js');
//var assert = require('assert');
var assert = require('chai').assert;
var common = require('../common.js');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doDelete = sriclient.delete;

var PATH_TO_USERS_FILE = 'elas-users-2015-10-14.csv';
var PATH_TO_MSGS_FILE = 'elas-messages-2015-10-26.csv';

exports = module.exports = function (base, logverbose) {
  'use strict';

  function debug(x) {
    if (logverbose) {
      console.log(x); // eslint-disable-line
    }
  }
  var cleanUp = function (jsonArray) {
    var promises = [];
    jsonArray.forEach(function (user) {
      debug('Start delete');
      promises.push(doDelete(base + user.href, 'annadv', 'test').then(
        function (deleteResponse) {
          if (deleteResponse.statusCode === 200) {
            debug('End delete');

          } else {
            debug('Delete failed (' + deleteResponse.statusCode + '): ' +
              deleteResponse.statusMessage);
            throw Error('Unable to delete ' + deleteResponse.req.path);
          }

        }));
    });
    return Q.all(promises).then(function () {
      debug('All deletes completed');
    });
  };
  var cleanUpParties = function () {
    return doGet(base + '/parties?aliasIn=LM,LM-1,LM-2', 'annadv', 'test').then(function (response) {
      var jsonArray = response.body.results;
      debug('Parties to be removed: ' + jsonArray);
      return cleanUp(jsonArray);
    });
  };
  var cleanUpPartyRelations = function () {
    return doGet(base + '/partyrelations?codeIn=100,101', 'annadv', 'test').then(function (response) {
      var jsonArray = response.body.results;
      debug('Partyrelations to be removed: ' + jsonArray);
      return cleanUp(jsonArray);
    });
  };

  describe('Elas import', function () {

    describe('CSV Importer', function () {
      it('should call function for each entry in CSV file', function () {
        var importMethod = function (entry) {
          debug('importing...');
          debug(entry); //here is json object to import
          //return Promise.reject('it fails');
          return Promise.resolve('it succeeds');
        };
        return importer(path.join(__dirname, PATH_TO_USERS_FILE), importMethod).then(function () {
          debug('test ended successfully');
        }).catch(function (err) {
          debug(err);
          throw err;
        });
      });
    });
    describe('Users', function () {
      before(function () {
        //logverbose = true;
        // clean up parties and partyrelations from previous run
        return cleanUpParties()
          .then(cleanUpPartyRelations)
          .catch(function (err) {
            debug('Error at clean up');
            debug(err);
          });
      });
      var validatePartyRelation = function (party, user, toRef) {
        return doGet(base + '/partyrelations?code=' + user.letscode, 'annadv', 'test')
          .then(function (responsePartyRel) {
            var partyrelations = responsePartyRel.body;
            var partyRel = partyrelations.results[0].$$expanded;
            debug(partyRel);
            assert.equal(partyRel.from.href, party.$$meta.permalink);
            if (typeof toRef !== 'undefined' && toRef) {
              assert.equal(partyRel.to.href, toRef);
            }
            if (user.accountrole === 'admin') {
              assert.equal(partyRel.type, 'administrator');
            } else {
              assert.equal(partyRel.type, 'member');
            }
            assert.equal(partyRel.code, user.letscode);
            assert.equal(partyRel.status, 'active');
          });
      };
      var validateParty = function (user, groupAlias) {
        return doGet(base + '/parties?alias=' + groupAlias + '-' + user.id, 'annadv', 'test').then(function (
          responseParty) {
          if (responseParty.statusCode !== 200) {
            debug('Error in get parties: ' + responseParty.statusCode);
          }
          var parties = responseParty.body;
          if (parties.$$meta.count === 0) {
            debug('No parties with alias ' + user.letscode + ' found !!');
            throw Error('No parties with alias ' + user.letscode + ' found');
          }
          debug('parties=' + JSON.stringify(parties));
          var party = parties.results[0].$$expanded;
          debug(party);
          assert.equal(party.type, 'person');
          assert.equal(party.name, user.name);
          assert.equal(party.alias, 'LM-' + user.id);
          //assert.equal(party.dateofbirth, user.?);
          assert.equal(party.login, user.login);
          //assert.equal(party.password, user.password); //unable to test, password not included in get
          assert.equal(party.status, 'active');
          return party;
        });
      };
      it('should load users from CSV file', function () {
        var partyUrl = common.hrefs.PARTY_LETSDENDERMONDE;
        return importer(path.join(__dirname, PATH_TO_USERS_FILE), function (user) {
          return importUser(user, partyUrl).then(function () {
            // Get and validate imported user
            // FIXME: get is started before put is completed...
            return doGet(base + '/parties?alias=100', 'annadv', 'test');
          }).then(function (response) {
            if (response.statusCode !== 200) {
              debug('Error in get parties: ' + response.statusCode);
            }
            var parties = response.body;
            if (parties.$$meta.count === 0) {
              debug('No parties with alias 100 found !!');
              throw Error('No parties with alias 100 found in test load users from CSV file');
            }
            debug('parties=' + JSON.stringify(parties));
            var party = parties.results[0].$$expanded;
            debug('Inserted party = ' + JSON.stringify(party));
            assert.equal(party.alias, '100');
            assert.equal(party.type, 'person');
            assert.equal(party.name, 'Jules the admin');
            assert.equal(party.status, 'active');
          }).catch(function (err) {
            debug('importUser failed');
            debug(err);
            throw err;
          });
        });
      });

      it('should import a regular user', function () {
        logverbose = true;
        var regularUser = {
          id: 1,
          status: 1,
          name: 'Jeff the tester',
          fullname: '',
          login: 'tester',
          password: 'a028dd95866a4e56cca1c08290ead1c75da788e68460faf597bd6d' +
            '364677d8338e682df2ba3addbe937174df040aa98ab222626f224cbccbed6f33c93422406b',
          accountrole: 'user',
          letscode: 101,
          minlimit: -400,
          maxlimit: 400
        };
        var groupAlias = 'LM';

        return importUser(regularUser, common.hrefs.PARTY_LETSDENDERMONDE, groupAlias).then(function () {
          return validateParty(regularUser, groupAlias);
        }).then(function (party) {
          return validatePartyRelation(party, regularUser, common.hrefs.PARTY_LETSDENDERMONDE);
        });
      });
      it('should import an admin user', function () {
        var adminUser = {
          id: 2,
          status: 1,
          name: 'Jules the admin',
          fullname: '',
          login: 'admin',
          password: 'a028dd95866a4e56cca1c08290ead1c75da788e68460faf597bd6d364677d' +
            '8338e682df2ba3addbe937174df040aa98ab222626f224cbccbed6f33c93422406b',
          accountrole: 'admin',
          letscode: 100
        };
        var groupAlias = 'LM';
        return importUser(adminUser, common.hrefs.PARTY_LETSDENDERMONDE, groupAlias).then(function () {
          return validateParty(adminUser, groupAlias);
        }).then(function (party) {
          return validatePartyRelation(party, adminUser, common.hrefs.PARTY_LETSDENDERMONDE);
        });
      });
      it('should create group if it does not exist', function () {
        var regularUser = {
          id: 1,
          status: 1,
          name: 'Jeff the tester',
          fullname: '',
          login: 'tester',
          password: 'a028dd95866a4e56cca1c08290ead1c75da788e68460faf597bd6d' +
            '364677d8338e682df2ba3addbe937174df040aa98ab222626f224cbccbed6f33c93422406b',
          accountrole: 'user',
          letscode: 101,
          minlimit: -400,
          maxlimit: 400
        };
        var groupAlias = 'LM';
        logverbose = true;
        return importUsers.addUserToGroup(regularUser, groupAlias).then(function () {
          return validateParty(regularUser, groupAlias);
        }).then(function (party) {
          return validatePartyRelation(party, regularUser, null);
        });
      });
      it('should check that LM party exists', function () {
        logverbose = true;
        var url = base + '/parties?alias=LM';
        return checkPartyExists(url).then(function (partyUrl) {
          debug('Party Url = ' + partyUrl);
          assert.ok(partyUrl, 'party should be found');
        });
      });
      it('should check that UNKNOWN party does not exists', function () {
        var url = base + '/parties?alias=UNKNOWN';
        return checkPartyExists(url).then(function (partyUrl) {
          assert.isFalse(partyUrl, 'party should not be found');
        });
      });
    });
    describe('Messages', function () {
      it('should load messages from CSV file', function () {
        //return messagesImporter(path.join(__dirname, PATH_TO_MSGS_FILE), common.hrefs.PARTY_LETSDENDERMONDE)
        return importer(path.join(__dirname, PATH_TO_MSGS_FILE), function (message) {
          return importMessage(message, common.hrefs.PARTY_LETSDENDERMONDE);
        }).then(function () {
          // Get and validate imported message
          // TODO: filter get to return newly inserted message
          return doGet(base + '/messages', 'annadv', 'test').then(function (response) {
            var messages = response.body;
            debug(messages);
            var message = messages.results[0].$$expanded;
            debug(message);
            // TODO: match assertions with inserted messages
            //assert.equal(message.title, '100');
            //assert.equal(message.description, 'test message');
          });
        });
      });
      it('should not fail with TypeError', function () {
        // Increase loop to 100 to reproduce the error
        logverbose = true;
        var jsonObj = {
          id: 28,
          id_user: 1, // eslint-disable-line
          content: 'Te leen: Franstalige strips voor volwassenen',
          Description: 'Heb strips liggen van Garulfo, Largo Winch, Lanfeust de Troy in de franstalige versie.',
          amount: 5,
          units: 'week',
          msg_type: 1, // eslint-disable-line
          id_category: 37, // eslint-disable-line
          cdate: '2011-04-03 22:51:29',
          mdate: '2014-02-15 19:42:55',
          validity: '2015-02-10 19:42:55'
        };
        var hrefs = {
          PARTY_LETSDENDERMONDE: '/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849'
        };
        var importMethod = function (message) {
          return importMessage(message, hrefs.PARTY_LETSDENDERMONDE);
        };

        var logEndImport = function () {
          debug('End import');
        };
        var logImportError = function (error) {
          debug('Import failed with error: ' + error + ' (jsonObj=' + JSON.stringify(
              jsonObj) +
            ')');
          throw error;
        };
        var promises = [];
        var i = 0;
        for (i = 0; i < 10; i++) {
          debug('Start import');
          promises.push(importMethod(jsonObj).then(logEndImport).catch(logImportError));
        }
        return Q.all(promises).then(function () {
          deferred.resolve();
        }).catch(function (e) {
          debug('Q.all failed !');
          debug(e);
          throw e;
        });
      });
    });
    describe.skip('Transactions', function () {
      it('should import a transaction', function () {
        var transaction = {
          id: 687,
          id_from: 1, // eslint-disable-line
          id_to: 2, // eslint-disable-line
          amount: 20,
          description: 'Ikea rekje'
        };
        var groupAlias = 'LM';
        logverbose = true;
        return importTransactions(transaction, groupAlias).then(function () {
          // FIXME: add assertions to validate successful import of transaction
          //          return validateTransaction(transaction, groupAlias);
          //        }).then(function (party) {
          //          return validateTransactionRelation(party, regularUser, null);
        });
      });
    });
  });
};
