var Q = require('q');
var UUID = require('uuid-1345');

exports = module.exports = {


  /**
  Returns a promise with resulting UUID as single argument
  usage:
    return generateUUIDv5FromUrl(name).then(function (result) {
      // Do something wih result
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
  }
};
