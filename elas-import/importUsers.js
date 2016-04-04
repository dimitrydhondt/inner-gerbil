/*eslint-env node*/
var generateUUID = require('../test/common.js').generateUUID;
var Q = require('q');
var common = require('../js/common.js');
var debug = common.debug;
var warn = common.warn;
var error = common.error;

var port = 5000;
var base = 'http://localhost:' + port;

var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;

/*function debug(x) {
  console.log(x); // eslint-disable-line
}*/

function validUser(user) {
  'use strict';
  // check mandatory fields are available
  if (typeof user.letscode === 'undefined' && typeof user.id === 'undefined') {
    return false;
  }

  if (typeof user.login === 'undefined') {
    return false;
  }

  if (typeof user.name === 'undefined') {
    return false;
  }

  if (typeof user.status === 'undefined') {
    return false;
  }

  return true;
}

function interletsUser(user) {
  'use strict';
  // Import of interlets users not supported
  if (user.accountrole === 'interlets') {
    return true;
  }
  return false;
}

exports = module.exports = {
  // Check if party exists with given url query and ultimately returns:
  // - href if party exist,
  // - false if party not found
  // - undefined in case of error in lookup
  checkPartyExists: function (url) {
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
  },
  addUserToGroup: function (user, groupAlias) {
    'use strict';

    // creates a group with given alias and returns its href
    var createGroup = function (alias) {
      var group = {
        type: 'group',
        name: alias,
        alias: alias,
        status: 'inactive'
      };
      var groupHref = '/parties/' + generateUUID();
      return doPut(base + groupHref, group, 'annadv', 'test').then(function (
        createGroupResponse) {
        if (createGroupResponse.statusCode !== 200 && createGroupResponse.statusCode !== 201) {
          debug('Error in creation of group: ' + createGroupResponse.statusCode);
          debug(createGroupResponse.body);
          throw Error('Unable to create group with alias ' + alias);
        }
        debug('Group created - status code ' + createGroupResponse.statusCode + '; body=' +
          createGroupResponse.body);
        return groupHref;
      });
    };
    debug('Checking party with alias ' + groupAlias + ' already exists');
    return exports.checkPartyExists(base + '/parties?alias=' + groupAlias).then(function (partyHref) {
      if (!partyHref) {
        debug('Party with groupAlias ' + groupAlias + ' does not exist -> creating');
        return createGroup(groupAlias);
      }
      debug('Party with groupAlias ' + groupAlias + ' already exists with href ' + partyHref);
      return partyHref;
    }).then(function (partyHref) {
      return exports.addUserToParty(user, partyHref, groupAlias);
    });
  },
  addUserToParty: function (user, partyUrl, groupAlias) {
    'use strict';
    var partyPassword;
    var alias;

    if (!validUser(user)) {
      warn('invalid user - missing mandatory data for ' + JSON.stringify(user));
      return Q.fcall(function () {
        throw new Error('Invalid user');
      });
    }
    if (interletsUser(user)) {
      warn('Import of Interlets user not supported. Skipping user ' + JSON.stringify(user));
      //return deferred.resolve('Not supported');
      return Q.fcall(function () {
        return 'Not supported';
      });
    }
    var uuid = generateUUID();
    var convUserStatusToPartyStatus = function (status) {
      switch (status) {
      case 0: // inactief
        return 'inactive';
      case 1: // actieve letser
        return 'active';
      case 2: // uitstapper
        return 'active';
      case 3: // instapper
        return 'active';
      case 4: // secretariaat
        return 'active';
      case 5: // infopakket
        return 'inactive';
      case 6: // instap gevolgd
        return 'inactive';
      case 7: // extern
        return 'active';
      default:
        return 'inactive';
      }
    };
    if (user.id) {
      alias = groupAlias + '-' + user.id.toString();
    } else {
      alias = user.letscode;
    }
    if (typeof user.password === 'undefined' || user.password === '\\N' || user.password === '') {
      partyPassword = 'dummy';
    } else {
      partyPassword = user.password;
    }
    warn('partyPassword = ' + partyPassword);
    var party = {
      type: 'person',
      name: user.name,
      alias: alias,
      login: user.login,
      password: partyPassword,
      //status: convUserStatusToPartyStatus(user.status)
      status: 'active' // force active to allow import of transactions
    };
    debug('party: ' + JSON.stringify(party));
    // check party already exists??
    return exports.checkPartyExists(base + '/parties?alias=' + party.alias).then(function (partyHref) {
      if (!partyHref) {
        debug('party does not exist yet -> creating');
        return;
      }
      warn('party already exists (url = ' + partyHref + ') -> skipping creation');
      throw new Error('party already exists');
    }).then(function () {
      var partyrelationAdmin;
      var adminRelation;
      var partyrelation = {
        from: {
          href: '/parties/' + uuid
        },
        to: {
          href: partyUrl // FIXME: should be partyHref but not in scope??
        },
        type: 'member',
        balance: 0,
        code: user.letscode.toString(),
        //status: convUserStatusToPartyStatus(user.status)
        status: 'active' // force active to allow import of transactions

      };
      debug('partyrelation:' + partyrelation);
      var batchBody = [
        {
          href: '/parties/' + uuid,
          verb: 'PUT',
          body: party
        },
        {
          href: '/partyrelations/' + generateUUID(),
          verb: 'PUT',
          body: partyrelation
        }
      ];

      if (user.accountrole === 'admin') {
        // create admin relationship
        partyrelationAdmin = {
          from: {
            href: '/parties/' + uuid
          },
          to: {
            href: partyUrl // FIXME: should be partyHref but not in scope??
          },
          type: 'administrator',
          balance: 0,
          code: user.letscode.toString(),
          status: convUserStatusToPartyStatus(user.status)
        };
        adminRelation = {
          href: '/partyrelations/' + generateUUID(),
          verb: 'PUT',
          body: partyrelationAdmin
        };
        batchBody.push(adminRelation);
      }
      return doPut(base + '/batch', batchBody, 'annadv', 'test');
    }).then(function (
      response) {
      if (response.statusCode !== 200 && response.statusCode !== 201) {
        error('PUT failed, response = ' + JSON.stringify(response));
      } else {
        debug('PUT successful');
      }
    }).catch(function (e) {
      debug('error catched:' + e);
      if (e.message === 'party already exists') {
        return;
      }
      error('importUser failed with error ' + e);
      throw e;
    });
  }
};
