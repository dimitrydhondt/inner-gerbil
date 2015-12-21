var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;
var doDelete = sriclient.delete;
var common = require('./common.js');
var common2 = require('../js/common.js');
var cl = common2.cl;
//var createHrefArray = common.createHrefArray;
//var expect = require('chai').expect;

exports = module.exports = function (base, logverbose) {
  'use strict';

  function debug(x) {
    if (logverbose) {
      cl(x);
    }
  }

  describe('/transactions', function () {
    describe('PUT', function () {
      var uuid;

      it('should not be possible to create /transactionrelations directly.', function () {
        // First create a transaction.
        var body = {
          from: {href: common.hrefs.PARTY_ANNA},
          to: {href: common.hrefs.PARTY_STEVEN},
          amount: 20
        };
        uuid = common.generateUUID();
        debug('Generated UUID=' + uuid);

        return doPut(base + '/transactions/' + uuid, body, 'annadv', 'test').then(function () {
          var trr;
          trr = {
            key: common.generateUUID(),
            transaction: {href: '/transactions/' + uuid},
            partyrelation: {href: common.hrefs.PARTYRELATION_ANNA_LETSLEBBEKE},
            amount: 20
          };
          return doPut(base + '/transactionrelations/' + trr.key, trr, 'annadv', 'test');
        }).then(function (response) {
          debug('response of PUT');
          debug(response.body);
          debug('Status code :');
          debug(response.statusCode);
          if (response.statusCode === 201) {
            assert.fail('creation of /transactionrelations MUST fail !');
          }
          assert.equal(response.body.errors[0].code, 'not.allowed.to.create.transactionrelations');
        }).catch(function (err) {
          cl(err);
          throw err;
        });
      });

      it('should not be possible to update /transactionrelations directly.', function () {
        // First create a transaction.
        var body = {
          from: {href: common.hrefs.PARTY_ANNA},
          to: {href: common.hrefs.PARTY_STEVEN},
          amount: 20
        };
        uuid = common.generateUUID();
        debug('Generated UUID=' + uuid);

        return doPut(base + '/transactions/' + uuid, body, 'annadv', 'test').then(function () {
          return doGet(base + '/transactionrelations?transaction=/transactions/' + uuid, 'annadv', 'test');
        }).then(function (response) {
          debug('/transactionrelations that were created :');
          debug(response.body);
          var trr;
          trr = {
            key: response.body.results[0].$$expanded.key,
            transaction: {href: response.body.results[0].$$expanded.transaction.href},
            partyrelation: {href: response.body.results[0].$$expanded.partyrelation.href},
            amount: 11  // Try to modify the amount on a generated /transactionrelation
          };
          return doPut(base + '/transactionrelations/' + trr.key, trr, 'annadv', 'test');
        }).then(function (response) {
          debug('response of PUT');
          debug(response.body);
          debug('Status code :');
          debug(response.statusCode);
          if (response.statusCode === 201) {
            assert.fail('creation of /transactionrelations MUST fail !');
          }
          assert.equal(response.body.errors[0].code, 'not.allowed.to.update.transactionrelations');
        }).catch(function (err) {
          cl(err);
          throw err;
        });
      });

      it('should not be possible to delete /transactionrelations.', function () {
        // First create a transaction.
        var body = {
          from: {href: common.hrefs.PARTY_ANNA},
          to: {href: common.hrefs.PARTY_STEVEN},
          amount: 20
        };
        uuid = common.generateUUID();
        debug('Generated UUID=' + uuid);

        return doPut(base + '/transactions/' + uuid, body, 'annadv', 'test').then(function () {
          return doGet(base + '/transactionrelations?transaction=/transactions/' + uuid, 'annadv', 'test');
        }).then(function (response) {
          debug('/transactionrelations that were created :');
          debug(response.body);
          return doDelete(base + '/transactionrelations/' + response.body.results[0].$$expanded.key, 'annadv', 'test');
        }).then(function (response) {
          debug('Result of delete operation :');
          debug(response.body);
          if (response.statusCode === 200) {
            assert.fail('creation of /transactionrelations MUST fail !');
          }
          assert.equal(response.body.errors[0].code, 'not.allowed.to.delete.transactionrelations');
        }).catch(function (err) {
          cl(err);
          throw err;
        });
      });
    });
  });


  // TODO : Check that update of balance on /partyrelations are ignored !
};
