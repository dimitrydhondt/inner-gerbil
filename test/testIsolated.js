var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;
var common = require('./common.js');
var c2 = require('../js/common.js');
var debug = c2.debug;
//var createHrefArray = common.createHrefArray;
//var expect = require('chai').expect;

exports = module.exports = function (base) {
  'use strict';

  describe('/transactions', function () {
    describe('PUT', function () {
      // Check transaction inside of a single subgroup.
      // Check that the transactionrelations are terminated on the subgroup level.
      it('should create /transactionrelations for 2 members of the same subgroup.', function () {
        var body = {
          from: {href: common.hrefs.PARTY_ANNA},
          to: {href: common.hrefs.PARTY_STEVEN},
          amount: 20
        };
        var uuid = common.generateUUID();
        var transaction;
        var partyrelations;

        debug('Generated UUID=' + uuid);
        return doPut(base + '/transactions/' + uuid, body, 'annadv', 'test').then(function (response) {
          debug('response of PUT');
          debug(response.body);
          assert.equal(response.statusCode, 201);
          return doGet(base + '/transactions/' + uuid, 'annadv', 'test');
        }).then(function (response) {
          debug('response of GET');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.from.href, common.hrefs.PARTY_ANNA);
          assert.equal(response.body.to.href, common.hrefs.PARTY_STEVEN);
          assert.equal(response.body.amount, 20);
          //Store for use in later steps
          transaction = response.body;
          return doGet(base + '/transactionrelations?transaction=/transactions/' + uuid,
            'annadv', 'test');
        }).then(function (response) {
          debug('response of GET of /transactionrelations for the transaction');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.results.length, 2);
          assert.equal(response.body.results[0].$$expanded.transaction.href, transaction.$$meta.permalink);
          assert.equal(response.body.results[1].$$expanded.transaction.href, transaction.$$meta.permalink);
          // Check total balance == 0
          assert.equal(response.body.results[0].$$expanded.amount +
                        response.body.results[1].$$expanded.amount, 0);
          partyrelations = [];
          partyrelations.push(response.body.results[0].$$expanded.partyrelation.href);
          partyrelations.push(response.body.results[1].$$expanded.partyrelation.href);
          return doGet(base + '/partyrelations?hrefs=' + partyrelations[0] + ',' + partyrelations[1],
            'annadv', 'test');
        }).then(function (response) {
          debug('reponse of GET of /partyrelations involved in the transaction');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.results.length, 2);
        });
      });
    });
  });
};
