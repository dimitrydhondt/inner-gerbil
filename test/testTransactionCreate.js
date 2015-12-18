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

      it('should be capable of routing a transaction between a subgroup and a group', function () {
        var body = {
          from: {href: common.hrefs.PARTY_ANNA},
          to: {href: common.hrefs.PARTY_RUDI},
          amount: 20
        };
        var uuid = common.generateUUID();
        var transaction;
        var partyrelations;
        var i;

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
          assert.equal(response.body.to.href, common.hrefs.PARTY_RUDI);
          assert.equal(response.body.amount, 20);
          //Store for use in later steps
          transaction = response.body;
          return doGet(base + '/transactionrelations?transaction=/transactions/' + uuid,
            'annadv', 'test');
        }).then(function (response) {
          debug('response of GET of /transactionrelations for the transaction');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.results.length, 3);
          for (i = 0; i < response.body.results.length; i++) {
            assert.equal(response.body.results[i].$$expanded.transaction.href, transaction.$$meta.permalink);
          }
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
          assert.equal(response.body.results.length, 3);
        });
      });
    });
  });

  // TODO : Check a PUT over a connector group (interlets)
  // TODO : Check that UPDATE on /transactionrelations is blocked.
  // TODO : Check that CREATE on /transactionrelations is blocked.

  // TODO : Check that update of balance on /partyrelations are ignored !
};
