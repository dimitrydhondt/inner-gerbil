var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var common = require('./common.js');
var createHrefArray = common.createHrefArray;
var expect = require('chai').expect;

exports = module.exports = function (base, logverbose) {
  'use strict';

  function debug(x) {
    if (logverbose) {
      console.log(x); // eslint-disable-line
    }
  }

  describe('/transactions', function () {
    describe('GET', function () {
      it('should allow full list retrieval.', function () {
        return doGet(base + '/transactions', 'annadv', 'test').then(function (response) {
          debug('statusCode : ' + response.statusCode);
          debug(response.body);
          assert.equal(response.statusCode, 200);
          // TODO: add more transactions to test data
          if (response.body.$$meta.count < 2) {
            assert.fail('Expected all transactions');
          }
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain(common.hrefs.TRANSACTION_ANNA_STEVEN_20);
          expect(hrefs).to.contain(common.hrefs.TRANSACTION_LEEN_EMMANUELLA_20);
        });
      });

      it('should support ?involvingAncestorsOfParties=ANNA', function () {
        return doGet(base + '/transactions?involvingAncestorsOfParties=' +
                     common.hrefs.PARTY_ANNA, 'annadv', 'test').then(function (response) {
          debug('statusCode : ' + response.statusCode);
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          assert.equal(hrefs.length, 0);
          expect(hrefs).to.not.contain(common.hrefs.TRANSACTION_ANNA_STEVEN_20);
          expect(hrefs).to.not.contain(common.hrefs.TRANSACTION_LEEN_EMMANUELLA_20);
        });
      });

      it('should allow parameter ?involvingDescendantsOfParties=LEBBEKE', function () {
        return doGet(base + '/transactions?involvingDescendantsOfParties=' +
                     common.hrefs.PARTY_LETSLEBBEKE, 'annadv', 'test').then(function (response) {
          debug('statusCode : ' + response.statusCode);
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain(common.hrefs.TRANSACTION_ANNA_STEVEN_20);
          expect(hrefs).to.not.contain(common.hrefs.TRANSACTION_LEEN_EMMANUELLA_20);
        });
      });

      it('should allow parameter ?involvingDescendantsOfParties=DENDERMONDE', function () {
        return doGet(base + '/transactions?involvingDescendantsOfParties=' +
                     common.hrefs.PARTY_LETSDENDERMONDE, 'annadv', 'test').then(function (response) {
          debug('statusCode : ' + response.statusCode);
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain(common.hrefs.TRANSACTION_ANNA_STEVEN_20);
          expect(hrefs).to.not.contain(common.hrefs.TRANSACTION_LEEN_EMMANUELLA_20);
        });
      });

      it('should allow parameter ?fromDescendantsOfParties=LEBBEKE|DENDERMONDE', function () {
        return doGet(base + '/transactions?fromDescendantsOfParties=' +
                     common.hrefs.PARTY_LETSLEBBEKE, 'annadv', 'test').then(function (response) {
          debug('statusCode : ' + response.statusCode);
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain(common.hrefs.TRANSACTION_ANNA_STEVEN_20);
          expect(hrefs).to.not.contain(common.hrefs.TRANSACTION_LEEN_EMMANUELLA_20);
        }).then(function () {
          return doGet(base + '/transactions?fromDescendantsOfParties=' +
                       common.hrefs.PARTY_LETSDENDERMONDE, 'annadv', 'test').then(function (response) {
            debug('statusCode : ' + response.statusCode);
            debug(response.body);
            assert.equal(response.statusCode, 200);
            var hrefs = createHrefArray(response);
            expect(hrefs).to.contain(common.hrefs.TRANSACTION_ANNA_STEVEN_20);
            expect(hrefs).to.not.contain(common.hrefs.TRANSACTION_LEEN_EMMANUELLA_20);
          });
        });
      });

      it('should allow parameter ?toDescendantsOfParties=LEBBEKE|DENDERMONDE', function () {
        return doGet(base + '/transactions?toDescendantsOfParties=' +
                     common.hrefs.PARTY_LETSLEBBEKE, 'annadv', 'test').then(function (response) {
          debug('statusCode : ' + response.statusCode);
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain(common.hrefs.TRANSACTION_ANNA_STEVEN_20);
          expect(hrefs).to.not.contain(common.hrefs.TRANSACTION_LEEN_EMMANUELLA_20);
        }).then(function () {
          return doGet(base + '/transactions?toDescendantsOfParties=' +
                       common.hrefs.PARTY_LETSDENDERMONDE, 'annadv', 'test').then(function (response) {
            debug('statusCode : ' + response.statusCode);
            debug(response.body);
            assert.equal(response.statusCode, 200);
            var hrefs = createHrefArray(response);
            expect(hrefs).to.contain(common.hrefs.TRANSACTION_ANNA_STEVEN_20);
            expect(hrefs).to.not.contain(common.hrefs.TRANSACTION_LEEN_EMMANUELLA_20);
          });
        });
      });

      it('its should allow /transactions?involvingPartiesReachableFromParties=...', function () {
        return doGet(base + '/transactions?involvingPartiesReachableFromParties=' +
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

      it('its should allow /transactions?fromPartiesReachableFromParties=...', function () {
        return doGet(base + '/transactions?fromPartiesReachableFromParties=' +
                     common.hrefs.PARTY_GEERT, 'geertg', 'test').then(function (response) {
          var i, current, found;
          debug('All transactions from parties reachable from GeertG :');
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

      it('its should allow /transactions?toPartiesReachableFromParties=...', function () {
        return doGet(base + '/transactions?toPartiesReachableFromParties=' +
                     common.hrefs.PARTY_GEERT, 'geertg', 'test').then(function (response) {
          var i, current, found;
          debug('All transactions to parties reachable from GeertG :');
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

      it('its should allow /transactions?fromAncestorsOfParties=...', function () {
        return doGet(base + '/transactions?fromAncestorsOfParties=' +
                     common.hrefs.PARTY_ANNA, 'annadv', 'test').then(function (response) {
          debug('All transactions involving parties that are ancestors of Anna :');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          // Should return at least the default test data suite's transactions between :
          // Anna -> Steven : 20
          assert.equal(response.body.results.length, 0);
        });
      });

      it('its should allow /transactions?toAncestorsOfParties=...', function () {
        return doGet(base + '/transactions?toAncestorsOfParties=' +
                     common.hrefs.PARTY_ANNA, 'annadv', 'test').then(function (response) {
          debug('All transactions involving parties that are ancestors of Anna :');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          // Should return at least the default test data suite's transactions between :
          // Anna -> Steven : 20
          assert.equal(response.body.results.length, 0);
        });
      });
    });
  });
};
