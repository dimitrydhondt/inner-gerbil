/*eslint-env node*/
var common = require('../test/common.js');

var port = 5000;
var base = 'http://localhost:' + port;

var sriclient = require('sri4node-client');
var doPut = sriclient.put;

exports = module.exports = function (user, partyUrl) {
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
  var party = {
    type: 'person',
    name: user.name,
    alias: user.letscode.toString(),
    login: user.login,
    password: user.password,
    status: convUserStatusToPartyStatus(user.status)
  };
  console.log(party);
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

  return doPut(base + '/batch', batchBody, 'annadv', 'test').then(function (
    response) {
    if (response.statusCode !== 200 && response.statusCode !== 201) {
      console.log('PUT failed, response = ' + JSON.stringify(response));
    } else {
      console.log('PUT successful');
    }
  }).catch(function (e) {
    console.log('importUser failed');
    console.log(e);
    throw e;
  });
};
