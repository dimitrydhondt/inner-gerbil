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
    });
  });
};
