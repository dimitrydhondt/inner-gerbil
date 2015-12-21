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
      it('should not be possible to update /transactions.', function () {
        // First create a transaction.
        var body = {
          from: {href: common.hrefs.PARTY_ANNA},
          to: {href: common.hrefs.PARTY_STEVEN},
          amount: 20
        };
        var uuid = common.generateUUID();
        debug('Generated UUID=' + uuid);

        return doPut(base + '/transactions/' + uuid, body, 'annadv', 'test').then(function () {
          body.amount = 10;
          return doPut(base + '/transactions/' + uuid, body, 'annadv', 'test');
        }).then(function (response) {
          debug('response of update PUT');
          debug(response.body);
          debug('Status code :');
          debug(response.statusCode);
          if (response.statusCode === 201) {
            assert.fail('creation of /transactionrelations MUST fail !');
          }
          assert.equal(response.body.errors[0].code, 'not.allowed.to.update.transactions');
          return doGet(base + '/transactions/' + uuid, 'annadv', 'test');
        }).then(function (response) {
          debug('response of GET of original transaction');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.amount, 20);
        }).catch(function (err) {
          cl(err);
          throw err;
        });
      });

      it('should not be possible to delete /transactions.', function () {
        // First create a transaction.
        var body = {
          from: {href: common.hrefs.PARTY_ANNA},
          to: {href: common.hrefs.PARTY_STEVEN},
          amount: 20
        };
        var uuid = common.generateUUID();
        debug('Generated UUID=' + uuid);

        return doPut(base + '/transactions/' + uuid, body, 'annadv', 'test').then(function () {
          return doDelete(base + '/transactions/' + uuid, 'annadv', 'test');
        }).then(function (response) {
          assert.equal(response.statusCode, 403);
          return doGet(base + '/transactions/' + uuid, 'annadv', 'test');
        }).then(function (response) {
          debug('response of GET of original transaction');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.amount, 20);
        }).catch(function (err) {
          cl(err);
          throw err;
        });
      });
    });
  });


  // TODO : Check that update of balance on /partyrelations are ignored !
};
