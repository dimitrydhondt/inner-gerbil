/*eslint-env node*/
var Q = require('q');
var moment = require('moment');
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
var importUsers = require('./importUsers.js');
var checkPartyWithAliasExists = importUsers.checkPartyWithAliasExists;

/*
var addMessageBatch = function (message, partyUrl) {
  'use strict';
  var uuid = generateUUID();
  var messageparty = {
    message: {
      href: '/messages/' + uuid
    },
    party: {
      href: partyUrl
    }
  };
  var batchBody = [
    {
      href: '/messages/' + uuid,
      verb: 'PUT',
      body: message
    },
    {
      href: '/messageparties/' + generateUUID(),
      verb: 'PUT',
      body: messageparty
    }
  ];

  return doPut(base + '/batch', batchBody, 'annadv', 'test')
    .then(function (responsePut) {
        if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201) {
          var errorMsg = 'PUT failed, response = ' + JSON.stringify(responsePut);
          error(errorMsg);
          throw Error(errorMsg);
        }
        debug('PUT to messages and messageparties successful (batch=' + JSON.stringify(batchBody) + ')');
      },
      function (err) {
        error('Batch PUT failed with error: ' + err);
        throw err;
      });

};
*/
var validMessage = function (message) {
  'use strict';
  if (typeof message.id_user === 'undefined') {
    return false;
  }

  // Convert \N strings into null
  if (typeof message.amount !== 'undefined' && message.amount === '\\N') {
    message.amount = null;
  }

  // Convert unit to string if required
  if (typeof message.units !== 'undefined' && message.units !== 'string') {
    message.units = String(message.units);
  }
  return true;
};

var checkMessageExists = function (message) {
  'use strict';
  var errorMsg;
  var queryUrl = base + '/messages?title=' + message.title + '&postedByParties=' + message.author.href;
  debug('checking if message exist with query: ' + queryUrl);
  return doGet(queryUrl, 'annadv', 'test').then(function (getResponse) {
    if (getResponse.statusCode !== 200) {
      errorMsg = 'GET failed, response = ' + stringify(getResponse);
      error(errorMsg);
      throw Error(errorMsg);
    }
    var getBody = getResponse.body;
    if (getBody.$$meta.count === 0) {
      return false;
    }
    if (getBody.$$meta.count > 1) {
      throw Error('Multiple messages already exists');
    }
    return getBody.results[0].href;
  });
};

var checkMessagePartyExists = function (messageparty) {
  'use strict';
  var errorMsg;
  var queryUrl = base + messageparty.message.href;
  debug('checking if messageparty exist with query: ' + queryUrl);
  return doGet(queryUrl, 'annadv', 'test').then(function (getResponse) {
    var i;
    if (getResponse.statusCode !== 200) {
      errorMsg = 'GET failed, response = ' + stringify(getResponse);
      error(errorMsg);
      throw Error(errorMsg);
    }
    var getBody = getResponse.body;
    var postedInArray = getBody.$$postedInParties;
    if (typeof postedInArray === 'undefined' || postedInArray.constructor !== Array) {
      return false;
    }
    if (postedInArray.length === 0) {
      return false;
    }
    for (i = 0; i < postedInArray.length; i++) {
      if (postedInArray[i].href === messageparty.party.href) {
        return true;
      }
    }
    debug('postedInArray contains: ' + postedInArray);
    return false;
  });
};

var createMessageParty = function (messageparty) {
  'use strict';
  var msgpartyHref;

  info('Start import of messageparty ' + stringify(messageparty));
  return checkMessagePartyExists(messageparty).then(function (msgpartyExists) {
    var errorMsg;
    debug('checkMessagePartyExists returned ' + msgpartyExists);
    if (msgpartyExists) {
      msgpartyHref = msgpartyExists;
      debug('messageparty ' + stringify(messageparty) + ' already exists -> skipping creation');
      return 'OK';
    }
    // Messageparty needs to be created -> generate UUID
    var uuid = generateUUID();
    msgpartyHref = '/messageparties/' + uuid;
    debug('messageparty ' + msgpartyHref + ' will be created');
    return doPut(base + msgpartyHref, messageparty, 'annadv', 'test').then(function (responsePut) {
      if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201) {
        errorMsg = 'PUT failed, response = ' + stringify(responsePut);
        error(errorMsg);
        throw Error(errorMsg);
      }
      debug('PUT to messageparty successful (body=' + stringify(messageparty) + ')');
      return 'OK';
    });
  });
};

var createUpdateMessage = function (message, partyUrl) {
  'use strict';
  var msgHref;
  var uuid;

  info('Start import of message ' + stringify(message) + ' to party ' + partyUrl);
  return checkMessageExists(message).then(function (msgExists) {
    debug('checkMessagesExists returned ' + msgExists);
    if (!msgExists) {
      // Message needs to be created -> generate UUID
      uuid = generateUUID();
      msgHref = '/messages/' + uuid;
      info('message ' + msgHref + ' will be created (' + message.title + ')');
    } else {
      msgHref = msgExists;
      info('message ' + msgHref + ' already exists -> to be updated (' + message.title + ')');
    }
    return doPut(base + msgHref, message, 'annadv', 'test');
  }).then(function (responsePut) {
    var errorMsg;
    if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201) {
      errorMsg = 'PUT failed, response = ' + stringify(responsePut);
      error(errorMsg);
      throw Error(errorMsg);
    }
    debug('PUT to messages successful (body=' + stringify(message) + ')');
    var messageparty = {
      message: {
        href: msgHref
      },
      party: {
        href: partyUrl
      }
    };
    return createMessageParty(messageparty);
  }).catch(function (err) {
    error('PUT of message or messageparty failed with error: ' + err);
    throw err;
  });
};

var getTagsForElasMessage = function (msg) {
  'use strict';
  var tags = [];
  if (msg.msg_type === 1) {
    tags.push('Aanbod');
  }
  if (msg.msg_type === 0) {
    tags.push('Vraag');
  }
  return tags;
};

exports = module.exports = function (msg, groupPartyUrl) {
  'use strict';
  var authorAlias = 'LM' + '-' + msg.id_user;
  if (!validMessage(msg)) {
    warn('invalid message - missing mandatory data for ' + stringify(msg));
    return Q.fcall(function () {
      throw new Error('Invalid message');
    });
  }
  return checkPartyWithAliasExists(authorAlias).then(function (authorPartyUrl) {
    if (!authorPartyUrl) {
      error('Party with alias ' + authorAlias + ' does not exist');
      throw new Error('Party (' + authorAlias + ') does not exist, import users first');
    } else {
      debug('Party with alias ' + authorAlias + ' already exists with url ' + authorPartyUrl);
      return authorPartyUrl;
    }
  }).then(function (authorPartyUrl) {
    var message = {
      author: {
        href: authorPartyUrl
      },
      title: msg.content,
      description: msg.Description,
      amount: msg.amount,
      unit: msg.units,
      tags: getTagsForElasMessage(msg),
      photos: [],
      created: moment(msg.cdate),
      modified: moment(msg.cdate),
      expires: moment(msg.validity)
    };
    debug('Created message=' + stringify(message));
    return createUpdateMessage(message, groupPartyUrl);
  }).catch(function (e) {
    error('importMessage failed with error ' + e);
    throw e;
  });
};
