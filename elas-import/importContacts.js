/*eslint-env node*/
var Q = require('q');
var generateUUID = require('../test/common.js').generateUUID;
var common = require('../js/common.js');
var debug = common.debug;
var info = common.info;
var warn = common.warn;
var error = common.error;
var port = 5000;
var base = 'http://localhost:' + port;
var stringify = require('json-stringify-safe');

var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;

var validContact = function (contact) {
  'use strict';
  // TODO: to be completed - check for valid type, value is not empty
  return true;
};

var checkContactdetailExists = function (contactdetail) {
  'use strict';
  var errorMsg;
  var queryUrl = base + '/contactdetails?type=' + encodeURIComponent(contactdetail.type)
  + '&value=' + encodeURIComponent(contactdetail.value);
  info('checking if contactdetails exist with query: ' + queryUrl);
  return doGet(queryUrl, 'annadv', 'test').then(function (getResponse) {
    if (getResponse.statusCode !== 200) {
      error('problem when invoking url ' + queryUrl);
      errorMsg = 'GET failed, response = ' + stringify(getResponse.body);
      error(errorMsg);
      throw Error(errorMsg);
    }
    var getBody = getResponse.body;
    if (getBody.$$meta.count === 0) {
      return false;
    }
    if (getBody.$$meta.count > 1) {
      throw Error('Multiple contactdetails already exists');
    }
    return getBody.results[0].href;
  });
};

var checkPartyContactDetailExists = function (partycontactdetail) {
  'use strict';
  var errorMsg;
  var queryUrl = base + partycontactdetail.contactdetail.href;
  info('checking if partycontactdetail exist with query: ' + queryUrl);
  return doGet(queryUrl, 'annadv', 'test').then(function (getResponse) {
    var i;
    if (getResponse.statusCode !== 200) {
      errorMsg = 'GET failed, response = ' + stringify(getResponse.body);
      error(errorMsg);
      throw Error(errorMsg);
    }
    var getBody = getResponse.body;
    var postedInArray = getBody.$$parties;
    if (typeof postedInArray === 'undefined' || postedInArray.constructor !== Array) {
      return false;
    }
    if (postedInArray.length === 0) {
      return false;
    }
    for (i = 0; i < postedInArray.length; i++) {
      if (postedInArray[i].href === partycontactdetail.party.href) {
        return true;
      }
    }
    debug('postedInArray contains: ' + postedInArray);
    return false;
  });
};

var createPartyContactDetail = function (partycontactdetail) {
  'use strict';
  var partyContactHref;

  info('Start import of partycontactdetail ' + stringify(partycontactdetail));
  return checkPartyContactDetailExists(partycontactdetail).then(function (partyContactExists) {
    var errorMsg;
    debug('checkPartyContactDetailExists returned ' + partyContactExists);
    if (partyContactExists) {
      partyContactHref = partyContactExists;
      info('partycontactdetail ' + stringify(partycontactdetail) + ' already exists -> skipping creation');
      return 'OK';
    }
    // Messageparty needs to be created -> generate UUID
    var uuid = generateUUID();
    partyContactHref = '/partycontactdetails/' + uuid;
    info('partycontactdetail ' + partyContactHref + ' will be created');
    return doPut(base + partyContactHref, partycontactdetail, 'annadv', 'test').then(function (responsePut) {
      if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201) {
        errorMsg = 'PUT failed, response = ' + stringify(responsePut);
        error(errorMsg);
        throw Error(errorMsg);
      }
      info('PUT to partycontactdetail successful (body=' + stringify(partycontactdetail) + ')');
      return 'OK';
    });
  });
};

var createUpdateContactDetail = function (contactdetail, partyHref, partyUrl) {
  'use strict';
  var contactHref;
  var uuid;

  info('Start import of contactdetail ' + stringify(contactdetail) + ' to party ' + partyUrl);
  return checkContactdetailExists(contactdetail).then(function (contactExists) {
    debug('checkContactdetailExists returned ' + contactExists);
    if (!contactExists) {
      // Message needs to be created -> generate UUID
      uuid = generateUUID();
      contactHref = '/contactdetails/' + uuid;
      info('contactdetail ' + contactHref + ' will be created (' + contactdetail.value + ')');
    } else {
      contactHref = contactExists;
      info('contactdetail ' + contactHref + ' already exists -> to be updated (' + contactdetail.value + ')');
    }
    return doPut(base + contactHref, contactdetail, 'annadv', 'test');
  }).then(function (responsePut) {
    var errorMsg;
    if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201) {
      errorMsg = 'PUT failed, response = ' + stringify(responsePut.body);
      error(errorMsg);
      throw new Error(errorMsg);
    }
    var partycontactdetail = {
      contactdetail: {
        href: contactHref
      },
      party: {
        href: partyHref
      }
    };
    return createPartyContactDetail(partycontactdetail, partyUrl);
  }).catch(function (err) {
    error('PUT of contactdetail or partycontactdetail failed with error: ' + err);
    throw err;
  });
};

var getContactDetailType = function (idContactType) {
  'use strict';
  switch (idContactType) {
  case 1: // telefoon
  case 2: // gsm
    return 'phone';
  case 3:
    return 'email';
  case 4:
    return 'address';
  default:
    warn('unknown contact type ' + idContactType);
    return 'unknown';
  }
  return 'unknown';
};

var fillAddressData = function (contactdetail, contact) {
  'use strict';
//  contactdetail.street = contact.value;
//  contactdetail.streetnumber
//contactdetail.streetbus
//contactdetail.postalcode
//contactdetail.city
  return contactdetail;
};
exports = module.exports = function (contact, groupHref, groupAlias) {
  'use strict';
  if (!validContact(contact)) {
    warn('invalid message - missing mandatory data for ' + stringify(contact));
    return Q.fcall(function () {
      throw new Error('Invalid message');
    });
  }
  var contactdetail = {
    type: getContactDetailType(contact.id_type_contact),
    value: contact.value,
    public: true
  };
  if (contactdetail.type === 'address') {
    fillAddressData(contactdetail, contact);
  }
  debug('Created contactdetail=' + stringify(contactdetail));
  return createUpdateContactDetail(contactdetail, groupHref, groupAlias).catch(function (e) {
    error('importContact failed with error ' + e);
    throw e;
  });
};
