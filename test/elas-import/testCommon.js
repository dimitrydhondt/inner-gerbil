/*eslint-env node, mocha */
var Q = require('q');
//var assert = require('chai').assert;
//var common = require('../common.js');
var commonimport = require('../../elas-import/common.js');
var info = require('../../js/common.js').info;

exports = module.exports = function () {
  'use strict';
  describe('uuid', function () {
    it('should generate valid uuid v5', function () {

      var UUID = require('uuid-1345');
      //var rootUUID = '00000000-0000-0000-0000-000000000000';
      return Q.nfcall(UUID.v5, {
        namespace: UUID.namespace.url,
        name: 'https://elas.letsmechelen.vsbnet.be'
      }).then(function (result) {
        info('Generated a name-based UUID using SHA1:\n\t' + result + '\n');
      });
    });
    it('should generate valid uuid v5 for a url', function () {

      return commonimport.generateUUIDv5FromUrl('https://elas.letsmechelen.vsbnet.be')
        .then(function (result) {
          info('Generated a name-based UUID using SHA1:\n\t' + result + '\n');
        });
    });
    it('should generate valid uuid v5 for a namespace + name', function () {

      var name = 'myname';
      return commonimport.generateUUIDv5FromName('https://elas.letsmechelen.vsbnet.be', name)
        .then(function (result) {
          info('Generated a name-based UUID using SHA1:\n\t' + result + '\n');
        });
    });
  });
};
