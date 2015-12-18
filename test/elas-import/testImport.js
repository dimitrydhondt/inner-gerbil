/*eslint-env node, mocha */
var path = require('path');
var Q = require('q');
var importer = require('../../elas-import/importer.js');
var importUser = require('../../elas-import/importUsers.js');
var importMessage = require('../../elas-import/importMessages.js');
var assert = require('assert');
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

  describe('Elas import testing', function () {

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
    describe('Import users', function () {
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
        return doGet(base + '/parties?aliasIn=100,101', 'annadv', 'test').then(function (response) {
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
      before(function () {
        logverbose = true;
        // clean up parties and partyrelations from previous run
        return cleanUpParties()
          .then(cleanUpPartyRelations)
          .catch(function (err) {
            debug('Error at clean up');
            debug(err);
          });
      });
      var validatePartyRelation = function (party, user) {
        return doGet(base + '/partyrelations?code=' + user.letscode, 'annadv', 'test')
          .then(function (responsePartyRel) {
            var partyrelations = responsePartyRel.body;
            var partyRel = partyrelations.results[0].$$expanded;
            debug(partyRel);
            assert.equal(partyRel.from.href, party.$$meta.permalink);
            assert.equal(partyRel.to.href, common.hrefs.PARTY_LETSDENDERMONDE);
            if (user.accountrole === 'admin') {
              assert.equal(partyRel.type, 'administrator');
            } else {
              assert.equal(partyRel.type, 'member');
            }
            assert.equal(partyRel.code, user.letscode);
            assert.equal(partyRel.status, 'active');
          });
      };
      var validateParty = function (user) {
        return doGet(base + '/parties?alias=' + user.letscode, 'annadv', 'test').then(function (
          responseParty) {
          if (responseParty.statusCode !== 200) {
            debug('Error in get parties: ' + responseParty.statusCode);
          }
          var parties = responseParty.body;
          if (parties.$$meta.count === 0) {
            debug('No parties with alias 100 found !!');
            throw Error('No parties with alias 100 found');
          }
          debug('parties=' + JSON.stringify(parties));
          var party = parties.results[0].$$expanded;
          debug(party);
          assert.equal(party.type, 'person');
          assert.equal(party.name, user.name);
          assert.equal(party.alias, user.letscode);
          //assert.equal(party.dateofbirth, user.?);
          assert.equal(party.login, user.login);
          //assert.equal(party.password, user.password); //unable to test, password not included in get
          assert.equal(party.status, 'active');
          return validatePartyRelation(party, user);
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

        return importUser(regularUser, common.hrefs.PARTY_LETSDENDERMONDE).then(function () {
          return validateParty(regularUser);
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
        return importUser(adminUser, common.hrefs.PARTY_LETSDENDERMONDE).then(function () {
          return validateParty(adminUser);
        });
      });
    });
    describe('Import messages', function () {
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
    });
  });
};
