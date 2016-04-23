/*eslint-env node, mocha */
var Q = require('q');
var UUID = require('uuid-1345');
var sri4node = require('sri4node');
var debug = require('../js/common.js').debug;
var info = require('../js/common.js').info;
var error = require('../js/common.js').error;

var $u = sri4node.utils;


var archiveTable = function (database, table) {
  'use strict';
  var q = $u.prepareSQL('remove-deleted-' + table);
  q.sql('delete from ' + table + ' where "$$meta.deleted" = TRUE');
  return $u.executeSQL(database, q).then(function (result) {
    info('delete on ' + table + ' succeeded');
    debug(result);
  }).catch(function (err) {
    error('error in delete ' + table + ': ' + err);
  });
};

exports = module.exports = {


  generateUUIDv4: function () {
    'use strict';
    return Q.nfcall(UUID.v4);
  },
  /**
  Returns a promise with resulting UUID as single argument
  usage:
    return generateUUIDv5FromUrl(name).then(function (result) {
      // Do something with result
    });
  */
  generateUUIDv5FromUrl: function (name) {
    'use strict';
    return Q.nfcall(UUID.v5, {
      namespace: UUID.namespace.url,
      name: name
    });
  },
  generateUUIDv5FromNamespace: function (namespace, name) {
    'use strict';
    return Q.nfcall(UUID.v5, {
      namespace: namespace,
      name: name
    });

  },
  generateUUIDv5FromName: function (namespace, name) {
    'use strict';
    return exports.generateUUIDv5FromUrl(namespace).then(function (result) {
      return exports.generateUUIDv5FromNamespace(result, name);
    });
  },
  // Simply remove all logically deleted records
  archiveTables: function (db) {
    'use strict';
    var promises = [];
    promises.push(archiveTable(db, 'partycontactdetails'));
    promises.push(archiveTable(db, 'partyrelations'));
    promises.push(archiveTable(db, 'parties'));
    promises.push(archiveTable(db, 'messagecontactdetails'));
    promises.push(archiveTable(db, 'messageparties'));
    promises.push(archiveTable(db, 'messagerelations'));
    promises.push(archiveTable(db, 'messagetransactions'));
    promises.push(archiveTable(db, 'messages'));
    promises.push(archiveTable(db, 'transactionrelations'));
    promises.push(archiveTable(db, 'transactions'));
    return Q.all(promises);
  }
};
