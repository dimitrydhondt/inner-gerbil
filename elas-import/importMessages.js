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

var sriclient = require('sri4node-client');
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
    message.units = 'test';
  }
  return true;
};
var checkMessageExists = function (message) {
  'use strict';
  debug('TODO: check if message exist: ' + message);
  return false;
};

var addMessage = function (message, partyUrl) {
  'use strict';
  var errorMsg;

  if (checkMessageExists(message)) {
    return true;
  }
  var uuid = generateUUID();
  var messageparty = {
    message: {
      href: '/messages/' + uuid
    },
    party: {
      href: partyUrl
    }
  };

  return doPut(base + '/messages/' + uuid, message, 'annadv', 'test')
    .then(function (responsePut) {
      if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201) {
        errorMsg = 'PUT failed, response = ' + JSON.stringify(responsePut);
        error(errorMsg);
        throw Error(errorMsg);
      }
      debug('PUT to messages successful (body=' + JSON.stringify(message) + ')');
      return doPut(base + '/messageparties/' + generateUUID(), messageparty, 'annadv', 'test');
    }).then(function (responsePutMsgParty) {
      if (responsePutMsgParty.statusCode !== 200 && responsePutMsgParty.statusCode !== 201) {
        errorMsg = 'PUT failed, response = ' + JSON.stringify(responsePutMsgParty);
        error(errorMsg);
        throw Error(errorMsg);
      }
      debug('PUT to messageparties successful (body=' + JSON.stringify(messageparty) + ')');

    }).catch(function (err) {
      error('PUT of message or messageparty failed with error: ' + err);
      throw err;
    });
};

var getTagsForElasMessage = function (msg) {
  'use strict';
  var tags = [];
  if (msg.msg_type === '1') {
    tags.push('Aanbod');
  }
  if (msg.msg_type === '0') {
    tags.push('Vraag');
  }
  return tags;
};

exports = module.exports = function (msg, groupPartyUrl) {
  'use strict';
  var authorAlias = 'LM' + '-' + msg.id_user;
//  var partyHrefGlobal;
  debug('msg=' + JSON.stringify(msg));
  if (!validMessage(msg)) {
    warn('invalid message - missing mandatory data for ' + JSON.stringify(msg));
    return Q.fcall(function () {
      throw new Error('Invalid message');
    });
  }
  return checkPartyWithAliasExists(authorAlias).then(function (authorPartyUrl) {
    if (!authorPartyUrl) {
      info('Party with alias ' + authorAlias + ' does not exist');
      throw new Error('Party (' + authorAlias + ') does not exist, import users first');
    } else {
      info('Party with alias ' + authorAlias + ' already exists with url ' + authorPartyUrl);
//      partyHrefGlobal = partyUrl;
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
    return addMessage(message, groupPartyUrl);
  }).catch(function (e) {
    error('importMessage failed with error ' + e);
    throw e;
  });
};
