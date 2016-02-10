/*eslint-env node, mocha */
var path = require('path');
var Q = require('q');
var importer = require('../../elas-import/importer.js');
var importUsers = require('../../elas-import/importUsers.js');
var importUser = importUsers.addUserToParty;
var checkPartyExists = importUsers.checkPartyExists;
var assert = require('chai').assert;
var common = require('../common.js');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doDelete = sriclient.delete;

var PATH_TO_USERS_FILE = 'elas-users-2015-10-14.csv';

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
          logverbose = true;
          debug('User to import:' + JSON.stringify(user));
          return importUser(user, partyUrl, 'LM').then(function () {
            // Get and validate imported user
            // FIXME: get is started before put is completed...
            return doGet(base + '/parties?alias=LM-10', 'annadv', 'test');
          }).then(function (response) {
            if (response.statusCode !== 200) {
              debug('Error in get parties: ' + response.statusCode);
            }
            var parties = response.body;
            if (parties.$$meta.count === 0) {
              debug('No parties with alias LM-10 found !!');
              throw Error('No parties with alias LM-10 found in test load users from CSV file');
            }
            debug('parties=' + JSON.stringify(parties));
            var party = parties.results[0].$$expanded;
            debug('Inserted party = ' + JSON.stringify(party));
            assert.equal(party.alias, 'LM-10');
            assert.equal(party.type, 'person');
            assert.equal(party.name, 'Jules the admin');
            assert.equal(party.status, 'active');
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
  });
};
