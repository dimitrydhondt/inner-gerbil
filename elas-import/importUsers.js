/*eslint-env node*/
var common = require('../test/common.js');

var port = 5000;
var base = 'http://localhost:' + port;

var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;

function debug(x) {
  console.log(x); // eslint-disable-line
}

exports = module.exports = {
  // Check if party exists with given url query and ultimately returns:
  // - href if party exist,
  // - false if party not found
  // - undefined in case of error in lookup
  checkPartyExists: function (url) {
    return doGet(url, 'annadv', 'test').then(function (
      responseParty) {
      if (responseParty.statusCode !== 200) {
        debug('Error in get parties: ' + responseParty.statusCode);
        return;
      }
      var parties = responseParty.body;
      if (parties.$$meta.count === 0) {
        debug('No parties found with query url ' + url);
        debug(responseParty.body);
        return false;
      } else {
        return parties.results[0].href;
      }
    });
  },
  addUserToGroup: function (user, groupAlias) {
    'use strict';

    // creates a group with given alias and returns its href
    var createGroup = function (groupAlias) {
      var group = {
        type: 'group',
        name: groupAlias,
        alias: groupAlias,
        status: 'inactive'
      };
      var groupHref = '/parties/' + common.generateUUID();
      return doPut(base + groupHref, group, 'annadv', 'test').then(function (
        createGroupResponse) {
        if (createGroupResponse.statusCode !== 200 && createGroupResponse.statusCode !== 201) {
          debug('Error in creation of group: ' + createGroupResponse.statusCode);
          debug(createGroupResponse.body);
          throw Error('Unable to create group with alias ' + groupAlias);
        };
        debug('Group created - status code ' + createGroupResponse.statusCode + '; body=' +
          createGroupResponse.body);
        return groupHref;
      });
    };
    debug('Checking party with alias ' + groupAlias + ' already exists');
    return exports.checkPartyExists(base + '/parties?alias=' + groupAlias).then(function (partyUrl) {
      if (!partyUrl) {
        debug('Party with groupAlias ' + groupAlias + ' does not exist -> creating');
        return createGroup(groupAlias);
      } else {
        debug('Party with groupAlias ' + groupAlias + ' already exists with url ' + partyUrl);
        return partyUrl;
      }
    }).then(function (partyHref) {
      return exports.addUserToParty(user, partyHref, groupAlias);
    });
  },
  addUserToParty: function (user, partyUrl, groupAlias) {
    'use strict';
    var uuid = common.generateUUID();
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
    var convElasAccountroleToPartyrelType = function (accountrole) {
      if (accountrole === 'user') {
        return 'member';
      } else if (accountrole === 'admin') {
        return 'administrator';
      }
    };
    var alias;
    if (user.id) {
      alias = groupAlias + '-' + user.id.toString();
    } else {
      alias = user.letscode;
    }
    var party = {
      type: 'person',
      name: user.name,
      alias: alias,
      login: user.login,
      password: user.password,
      status: convUserStatusToPartyStatus(user.status)
    };
    console.log(party);
    // check party already exists??
    return exports.checkPartyExists(base + '/parties?alias=' + party.alias).then(function (partyUrl) {
      if (!partyUrl) {
        console.log('party does not exist yet -> creating');
        return;
      } else {
        console.log('party already exists (url = ' + partyUrl + ') -> skipping creation');
        throw 'party already exists';
      }
    }).then(function () {
      var partyrelation = {
        from: {
          href: '/parties/' + uuid
        },
        to: {
          href: partyUrl
        },
        type: convElasAccountroleToPartyrelType(user.accountrole),
        balance: 0,
        code: user.letscode.toString(),
        status: convUserStatusToPartyStatus(user.status)

      };
      console.log(partyrelation);
      var batchBody = [
        {
          href: '/parties/' + uuid,
          verb: 'PUT',
          body: party
          },
        {
          href: '/partyrelations/' + common.generateUUID(),
          verb: 'PUT',
          body: partyrelation
          }
      ];
      return doPut(base + '/batch', batchBody, 'annadv', 'test')
    }).then(function (
      response) {
      if (response.statusCode !== 200 && response.statusCode !== 201) {
        console.log('PUT failed, response = ' + JSON.stringify(response));
      } else {
        console.log('PUT successful');
      }
    }).catch(function (e) {
      if (e === 'party already exists') {
        return;
      }
      console.log('importUser failed');
      console.log(e);
      throw e;
    });
  }
};
