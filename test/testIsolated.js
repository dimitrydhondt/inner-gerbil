var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;
//var doDelete = sriclient.delete;
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
      it('should not be possible to update balance on /partyrelations.', function () {
        var originalBalance;
        return doGet(base + common.hrefs.PARTYRELATION_ANNA_LETSLEBBEKE, 'annadv', 'test').then(function (response) {
          debug('result of getting the partyrelation :');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          originalBalance = response.body.balance;
          response.body.balance = response.body.balance + 1;
          return doPut(base + common.hrefs.PARTYRELATION_ANNA_LETSLEBBEKE, response.body, 'annadv', 'test');
        }).then(function (response) {
          debug('response of update PUT');
          debug(response.body);
          debug('Status code :');
          debug(response.statusCode);
          assert.equal(response.statusCode, 200);
          return doGet(base + common.hrefs.PARTYRELATION_ANNA_LETSLEBBEKE, 'annadv', 'test');
        }).then(function (response) {
          debug('response of 2nd GET of partyrelation');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.balance, originalBalance);
        }).catch(function (err) {
          cl(err);
          throw err;
        });
      });
    });
  });

  // TODO : Check that update of balance on /partyrelations are ignored !
};
