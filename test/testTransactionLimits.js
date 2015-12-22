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
      it('should fail to create /transactions for 2 members of the same subgroup, ' +
         'when limits are exceeded.', function () {
        var body = {
          from: {href: common.hrefs.PARTY_ANNA},
          to: {href: common.hrefs.PARTY_STEVEN},
          amount: 10000000 /* Way too much */
        };
        var uuid = common.generateUUID();

        debug('Generated UUID=' + uuid);
        return doPut(base + '/transactions/' + uuid, body, 'annadv', 'test').then(function (response) {
          debug('response of PUT');
          debug(response.body);
          assert.equal(response.statusCode, 409);
          return doGet(base + '/transactions/' + uuid, 'annadv', 'test');
        }).then(function (response) {
          assert.equal(response.statusCode, 404);
        });
      });
    });
  });
};
