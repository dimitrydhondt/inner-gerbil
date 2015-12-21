var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var common = require('./common.js');
//var createHrefArray = common.createHrefArray;
//var expect = require('chai').expect;

exports = module.exports = function (base, logverbose) {
  'use strict';

  function debug(x) {
    if (logverbose) {
      console.log(x); // eslint-disable-line
    }
  }

  describe('/transactions', function () {
    describe('GET', function () {
      it('its should allow /transactions?fromPartiesReachableFromParties=...', function () {
        return doGet(base + '/transactions?fromPartiesReachableFromParties=' +
                     common.hrefs.PARTY_GEERT, 'geertg', 'test').then(function (response) {
          var i, current, found;
          debug('All transactions involving parties reachable from GeertG :');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          // Should return at least the default test data suite's transactions between :
          // Anna -> Steven : 20
          if (response.body.results.length < 1) {
            assert.fail('Should find at least transaction in LETS Lebbeke between Anna and Steven.');
          }
          found = false;
          for (i = 0; i < response.body.results.length; i++) {
            current = response.body.results[i].$$expanded;
            if (current.from.href === common.hrefs.PARTY_ANNA &&
                current.to.href === common.hrefs.PARTY_STEVEN &&
                current.amount === 20) {
              found = true;
              break;
            }
          }
          if (!found) {
            assert.fail('Unable to find the transactions Anna->Steven:20... Should be reachable from GeertG');
          }
        });
      });
    });
  });
};
