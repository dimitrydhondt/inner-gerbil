var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;
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
    describe('PUT', function () {
      it('should route a transaction between 2 subgroup over the common group', function () {
        var body = {
          from: {href: common.hrefs.PARTY_ANNA},
          to: {href: common.hrefs.PARTY_GEERT},
          amount: 20
        };
        var uuid = common.generateUUID();
        var transaction;
        var partyrelations;
        var i, sum = 0;

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
          assert.equal(response.body.to.href, common.hrefs.PARTY_GEERT);
          assert.equal(response.body.amount, 20);
          //Store for use in later steps
          transaction = response.body;
          return doGet(base + '/transactionrelations?transaction=/transactions/' + uuid,
            'annadv', 'test');
        }).then(function (response) {
          debug('response of GET of /transactionrelations for the transaction');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.results.length, 4);
          for (i = 0; i < response.body.results.length; i++) {
            assert.equal(response.body.results[i].$$expanded.transaction.href, transaction.$$meta.permalink);
          }
          // Check total balance == 0
          for (i = 0; i < response.body.results.length; i++) {
            sum += response.body.results[i].$$expanded.amount;
          }
          assert.equal(sum, 0);
          partyrelations = [];
          for (i = 0; i < response.body.results.length; i++) {
            partyrelations.push(response.body.results[i].$$expanded.partyrelation.href);
          }
          return doGet(base + '/partyrelations?hrefs=' + partyrelations.join(','),
            'annadv', 'test');
        }).then(function (response) {
          debug('reponse of GET of /partyrelations involved in the transaction');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.results.length, 4);
        });
      });
    });
  });

  // TODO : Check a PUT from subgroup to group level.
  // TODO : Check a PUT over a connector group (interlets)
  // TODO : Check that UPDATE on /transactionrelations is blocked.
  // TODO : Check that CREATE on /transactionrelations is blocked.

  // TODO : Check that update of balance on /partyrelations are ignored !
};
