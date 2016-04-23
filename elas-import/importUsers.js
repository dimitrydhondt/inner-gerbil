/*eslint-env node*/
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
var stringify = require('json-stringify-safe');


var commonImport = require('./common.js');
var generateRandomUuid = function () {
  'use strict';
  return commonImport.generateUUIDv4().then(function (uuid) {
    debug('Generated UUIDv4: ' + uuid);
    return uuid;
  });
};

//var generateUUID = function (alias) {
//  'use strict';
//  var namespace = 'http://elas.vsbnet.be';
//  return commonImport.generateUUIDv5FromName(namespace, alias).then(function (uuid) {
//    return uuid;
//  });
//};

var validUser = function (user) {
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
};

var interletsUser = function (user) {
  'use strict';
  // Import of interlets users not supported
  if (user.accountrole === 'interlets') {
    return true;
  }
  return false;
};

var convUserStatusToPartyStatus = function (status) {
  'use strict';
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
var createPartyFromUser = function (user, groupAlias) {
  'use strict';
  var alias;
  var partyPassword;

  if (typeof user.password === 'undefined' || user.password === '\\N' || user.password === '') {
    partyPassword = 'dummy';
  } else {
    partyPassword = user.password;
  }
  warn('partyPassword = ' + partyPassword);

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
    password: partyPassword,
    status: 'active' // force active to allow import of transactions
  };
  debug('party: ' + stringify(party));
  return party;
};

var checkPartyExists = function (party) {
  'use strict';
  // check party already exists
  // include deleted parties
  var url = base + '/parties/?alias=' + party.alias;
  return doGet(url, 'annadv', 'test').then(function (responseParty) {
    if (responseParty.statusCode === 404) {
      debug('No parties found with query url ' + url);
      debug(responseParty.body);
      return false;
    }
    if (responseParty.statusCode !== 200) {
      error('Error in get parties: ' + responseParty.statusCode);
      throw new Error('Unable to get party for alias: ' + party.alias + ' - statusCode: ' + responseParty.statusCode);
    }
    var parties = responseParty.body;
    if (parties.$$meta.count === 0) {
      debug('Party has been deleted (alias ' + party.alias + ')');
      debug(responseParty.body);
      return false;
    }
    if (parties.$$meta.count > 1) {
      debug('Duplicate parties found with query url ' + url);
      debug(responseParty.body);
      throw new Error('Duplicate parties found with query url ' + url);
    }
    return parties.results[0].href;
  }).catch(function (err) {
    debug('Error in checkPartyExists');
    debug('error: ' + err);
  });
};

var checkPartyrelationExists = function (partyrelation) {
  'use strict';
  // check partyrelation already exists
  // include deleted parties
  var url = base + '/partyrelations/?from=' + partyrelation.from.href + '&to='
  + partyrelation.to.href + '&type=' + partyrelation.type;
  return doGet(url, 'annadv', 'test').then(function (responsePartyrel) {
    if (responsePartyrel.statusCode === 404) {
      debug('No partyrelations found with query url ' + url);
      debug(responsePartyrel.body);
      return false;
    }
    if (responsePartyrel.statusCode !== 200) {
      error('Error in get parties: ' + responsePartyrel.statusCode);
      throw new Error('Unable to get party for alias: ' + partyrelation.alias
          + ' - statusCode: ' + responsePartyrel.statusCode);
    }
    var partyrelations = responsePartyrel.body;
    if (partyrelations.$$meta.count === 0) {
      debug('No partyrelations founds with query url ' + url);
      debug(responsePartyrel.body);
      return false;
    }
    if (partyrelations.$$meta.count > 1) {
      debug('Duplicate partyrelations found with query url ' + url);
      debug(responsePartyrel.body);
      throw new Error('Duplicate partyrelations found with query url ' + url);
    }
    return partyrelations.results[0].href;
  }).catch(function (err) {
    debug('Error in checkPartyrelationExists');
    debug('error: ' + err);
  });
};

var createUpdateParty = function (party) {
  'use strict';
  var partyHref;
  return checkPartyExists(party).then(function (partyExists) {
    if (partyExists) {
      warn('party already exists -> updating instead (method createUpdateParty)');
      return partyExists;
    }
    debug('party does not exist yet -> creating');
    return generateRandomUuid().then(function (uuid) {
      return '/parties/' + uuid;
    });
  }).then(function (partyHrefForPut) {
    partyHref = partyHrefForPut; // store value in createUpdateParty function scope
    return doPut(base + partyHrefForPut, party, 'annadv', 'test');
  }).then(function (putResponse) {
    if (putResponse.statusCode !== 200 && putResponse.statusCode !== 201) {
      error('PUT failed, response = ' + stringify(putResponse));
    } else {
      debug('PUT successful');
      return partyHref;
    }
  }).catch(function (e) {
    error('Creation/Update of party failed with error ' + e);
    throw e;
  });

};

var createUpdatePartyrelation = function (partyrelation) {
  'use strict';
  var partyrelationHref;
  return checkPartyrelationExists(partyrelation).then(function (partyrelationExists) {
    if (partyrelationExists) {
      warn('partyrelation already exists -> updating instead');
      return partyrelationExists;
    }
    debug('partyrelation does not exist yet -> creating');
    return generateRandomUuid().then(function (uuid) {
      return '/partyrelations/' + uuid;
    });
  }).then(function (partyrelationHrefForPut) {
    partyrelationHref = partyrelationHrefForPut;
    return doPut(base + partyrelationHref, partyrelation, 'annadv', 'test');
  }).then(function (putResponse) {
    if (putResponse.statusCode !== 200 && putResponse.statusCode !== 201) {
      error('PUT failed, response = ' + stringify(putResponse));
      throw new Error('Unable to PUT partyrelation (' + stringify(partyrelation) + ')');
    } else {
      debug('PUT successful');
      return partyrelationHref;
    }
  }).catch(function (e) {
    error('Creation/Update of partyrelation failed with error ' + e);
    throw e;
  });
};

exports = module.exports = {
  checkPartyWithAliasExists: function (alias) {
    'use strict';
    var party = {
      alias: alias
    };
    return checkPartyExists(party);
  },
  addUserToGroup: function (user, groupAlias) {
    'use strict';
    var group = {
      type: 'group',
      name: groupAlias,
      alias: groupAlias,
      status: 'inactive'
    };
    return createUpdateParty(group).then(function (partyHref) {
      return exports.addUserToParty(user, partyHref, groupAlias);
    });
  },

  addUserToParty: function (user, partyUrl, groupAlias) {
    'use strict';

    if (!validUser(user)) {
      warn('invalid user - missing mandatory data for ' + stringify(user));
      return Q.fcall(function () {
        throw new Error('Invalid user');
      });
    }
    if (interletsUser(user)) {
      warn('Import of Interlets user not supported. Skipping user ' + stringify(user));
      //return deferred.resolve('Not supported');
      return Q.fcall(function () {
        return 'Not supported';
      });
    }

    var party = createPartyFromUser(user, groupAlias);
    return createUpdateParty(party).then(function (partyHref) {
      // create party and partyrelation(s)
      var partyrelation = {
        from: {
          href: partyHref
        },
        to: {
          href: partyUrl
        },
        type: 'member',
        balance: 0,
        code: user.letscode.toString(),
        status: 'active' // force active to allow import of transactions
      };
      debug('partyrelation:' + stringify(partyrelation));
      return [partyHref, createUpdatePartyrelation(partyrelation)];
    }).spread(function (partyHref) {
      var partyrelationAdmin;
      if (user.accountrole === 'admin') {
        // create admin relationship
        partyrelationAdmin = {
          from: {
            href: partyHref
          },
          to: {
            href: partyUrl
          },
          type: 'administrator',
          balance: 0,
          code: user.letscode.toString(),
          status: convUserStatusToPartyStatus(user.status)
        };
        return createUpdatePartyrelation(partyrelationAdmin);
      }
      return partyHref;
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
