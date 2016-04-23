/*eslint-env node, mocha */
var path = require('path');
var Q = require('q');
var importer = require('../../elas-import/importer.js');
var importUsers = require('../../elas-import/importUsers.js');
var importUser = importUsers.addUserToParty;
//var checkPartyExists = importUsers.checkPartyExists;
var assert = require('chai').assert;
var common = require('../common.js');
var debug = require('../../js/common.js').debug;
var info = require('../../js/common.js').info;
var error = require('../../js/common.js').error;
var commonImport = require('../../elas-import/common.js');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doDelete = sriclient.delete;
var pg = require('pg');
var pgConnect = common.pgConnect;
//var pgExec = sriCommon.pgExec;

var PATH_TO_USERS_FILE = 'elas-users-2015-10-14.csv';
var db;

var cleanUp = function (base, jsonArray) {
  'use strict';
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
    info('All deletes completed\n\n');
  });
};
var cleanUpParties = function (base) {
  'use strict';
  return doGet(base + '/parties?aliasIn=LM,LM-1,LM-2', 'annadv', 'test').then(function (response) {
    var jsonArray = response.body.results;
    debug('Parties to be removed: ' + jsonArray);
    return cleanUp(base, jsonArray);
  }).then(function () {
    info('Parties removed');
    return;
  });
};
var cleanUpPartyRelations = function (base) {
  'use strict';
  return doGet(base + '/partyrelations?codeIn=100,101', 'annadv', 'test').then(function (response) {
    var jsonArray = response.body.results;
    debug('Partyrelations to be removed: ' + jsonArray);
    return cleanUp(base, jsonArray);
  }).then(function () {
    info('Partyrelations removed');
    return;
  });
};
var cleanUpDeletedParties = function (configuration) {
  'use strict';
  return pgConnect(pg, configuration).then(function (database) {
    db = database;
    return commonImport.archiveTables(db);
  }).then(function () {
    info('archiving of tables completed');
    return true;
  }).catch(function (err) {
    info('problem connecting to database');
    info(err);
    throw err;
  });
};

// Check if party exists with given url query and ultimately returns:
// - href if party exist,
// - false if party not found
// - undefined in case of error in lookup
var checkPartyExists = function (url) {
  'use strict';
  return doGet(url, 'annadv', 'test').then(function (
    responseParty) {
    if (responseParty.statusCode !== 200) {
      error('Error in get parties: ' + responseParty.statusCode);
      throw new Error('Unable to get party for url: ' + url + ' - statusCode: ' + responseParty.statusCode);
    }
    var parties = responseParty.body;
    if (parties.$$meta.count === 0) {
      debug('No parties found with query url ' + url);
      debug(responseParty.body);
      return false;
    }
    return parties.results[0].href;
  }).catch(function (err) {
    debug('Error in checkPartyExists for url ' + url);
    debug('error: ' + err);
  });
};

exports = module.exports = function (base, configuration) {
  'use strict';

  describe('Elas import', function () {
    describe('Users', function () {
      before(function () {
        debug('starting clean up');
        return cleanUpParties(base)
        .then(function () {
          return cleanUpPartyRelations(base);
        }).then(function () {
          return cleanUpDeletedParties(configuration);
        }).catch(function (err) {
          error('Error at clean up');
          throw err;
        });
      });
      var validatePartyRelation = function (party, user, toRef) {
        return doGet(base + '/partyrelations?code=' + user.letscode, 'annadv', 'test')
        .then(function (responsePartyRel) {
          var partyrelations = responsePartyRel.body;
          assert.isTrue(partyrelations.$$meta.count > 0);
          var partyRel = partyrelations.results[0].$$expanded;
          var partyRelAdmin;
          debug(partyRel);
          assert.equal(partyRel.from.href, party.$$meta.permalink);
          if (typeof toRef !== 'undefined' && toRef) {
            assert.equal(partyRel.to.href, toRef);
          }
          if (user.accountrole === 'admin') {
            // check 2 party relations are created for admin users
            assert.equal(partyrelations.results.length, 2);
            if (partyRel.type === 'administrator') {
              partyRelAdmin = partyRel;
              partyRel = partyrelations.results[1].$$expanded;
            } else {
              partyRelAdmin = partyrelations.results[1].$$expanded;
            }
            assert.equal(partyRelAdmin.type, 'administrator');
          }
          assert.equal(partyRel.type, 'member');
          assert.equal(partyRel.code, user.letscode);
          assert.equal(partyRel.status, 'active');
        });
      };
      var validateParty = function (user, groupAlias, expectedParty) {
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
          if (typeof expectedParty != 'undefined' && expectedParty.type) {
            assert.equal(party.type, expectedParty.type);
          } else {
            assert.equal(party.type, 'person');
          }
          if (typeof expectedParty != 'undefined' && expectedParty.name) {
            assert.equal(party.name, expectedParty.name);
          } else {
            assert.equal(party.name, user.name);
          }
          if (typeof expectedParty != 'undefined' && expectedParty.alias) {
            assert.equal(party.alias, expectedParty.alias);
          } else {
            assert.equal(party.alias, 'LM-' + user.id);
          }
          // assert.equal(party.dateofbirth, user.?);
          if (typeof expectedParty != 'undefined' && expectedParty.login) {
            assert.equal(party.login, expectedParty.login);
          } else {
            assert.equal(party.login, user.login);
          }
          // assert.equal(party.password, user.password); //unable to test,
          // password not included in get
          if (typeof expectedParty != 'undefined' && expectedParty.status) {
            assert.equal(party.status, expectedParty.status);
          } else {
            assert.equal(party.status, 'active');
          }
          return party;
        });
      };
      it('should load users from CSV file', function () {
        var partyUrl = common.hrefs.PARTY_LETSDENDERMONDE;
        return importer(path.join(__dirname, PATH_TO_USERS_FILE), function (user) {
          debug('User to import:' + JSON.stringify(user));
          return importUser(user, partyUrl, 'LM').then(function () {
            // Get and validate imported user
            // FIXME: get is started before put is completed  .
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
          var expectedParty = {
            type: 'person',
            name: 'Jeff the tester',
            alias: 'LM-1',
            login: 'tester',
            status: 'active'
          };
          return validateParty(regularUser, groupAlias, expectedParty);
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
          var expectedParty = {
            type: 'person',
            name: 'Jules the admin',
            alias: 'LM-2',
            login: 'admin',
            status: 'active'
          };
          return validateParty(adminUser, groupAlias, expectedParty);
        }).then(function (party) {
          return validatePartyRelation(party, adminUser, common.hrefs.PARTY_LETSDENDERMONDE);
        });
      });
      it('should skip import of interlets user', function () {
        var interletsUser = {
          id: 2,
          status: 7,
          name: 'Interlets group',
          fullname: '\N',
          login: 'lap',
          password: 'a028dd95866a4e56cca1c08290ead1c75da788e68460faf597bd6d364677d' +
          '8338e682df2ba3addbe937174df040aa98ab222626f224cbccbed6f33c93422406b',
          accountrole: 'interlets',
          letscode: 'LM200',
          minlimit: '-2000',
          maxlimit: '2000'
        };
        var groupAlias = 'LM';
        return importUser(interletsUser, common.hrefs.PARTY_LETSDENDERMONDE, groupAlias).then(function (
            result) {
          debug('result:' + result);
          assert.equal(result, 'Not supported');
        });
      });
      it('should import users with no password', function () {
        var inactiveUser = {
          id: 9999,
          status: 6,
          name: 'Inactive user',
          fullname: '\\N',
          login: 'inactive',
          password: '\\N',
          accountrole: 'user',
          letscode: 'LM095',
          minlimit: '-200',
          maxlimit: '200'
        };
        var groupAlias = 'LM';
        return importUser(inactiveUser, common.hrefs.PARTY_LETSDENDERMONDE, groupAlias).then(function () {
          var expectedParty = {
            type: 'person',
            name: 'Inactive user',
            alias: 'LM-9999',
            login: 'inactive',
            status: 'active' // all users forced to active for transaction
            // import
          };
          return validateParty(inactiveUser, groupAlias, expectedParty);
          // }).then(function (party) {
          // return validatePartyRelation(party, inactiveUser, null);
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
        return importUsers.addUserToGroup(regularUser, groupAlias).then(function () {
          return validateParty(regularUser, groupAlias);
        }).then(function (party) {
          return validatePartyRelation(party, regularUser, null);
        });
      });
      it('should check that LM party exists', function () {
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
