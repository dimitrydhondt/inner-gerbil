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
      it('should be capable of routing a transaction between over a connectorgroup', function () {
        var body = {
          from: {href: common.hrefs.PARTY_JOMMEKE},
          to: {href: common.hrefs.PARTY_FILIBERKE},
          amount: 10
        };
        var uuid = common.generateUUID();
        var transaction;
        var partyrelations;
        var i;

        debug('Generated UUID=' + uuid);
        return doPut(base + '/transactions/' + uuid, body, 'jommeke', 'test').then(function (response) {
          debug('response of PUT');
          debug(response.body);
          assert.equal(response.statusCode, 201);
          return doGet(base + '/transactions/' + uuid, 'jommeke', 'test');
        }).then(function (response) {
          debug('response of GET');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.from.href, common.hrefs.PARTY_JOMMEKE);
          assert.equal(response.body.to.href, common.hrefs.PARTY_FILIBERKE);
          assert.equal(response.body.amount, 10);
          //Store for use in later steps
          transaction = response.body;
          return doGet(base + '/transactionrelations?transaction=/transactions/' + uuid,
            'jommeke', 'test');
        }).then(function (response) {
          debug('response of GET of /transactionrelations for the transaction');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.results.length, 4);
          for (i = 0; i < response.body.results.length; i++) {
            assert.equal(response.body.results[i].$$expanded.transaction.href, transaction.$$meta.permalink);
          }
          partyrelations = [];
          for (i = 0; i < response.body.results.length; i++) {
            partyrelations.push(response.body.results[i].$$expanded.partyrelation.href);
          }
          return doGet(base + '/partyrelations?hrefs=' + partyrelations.join(','),
            'jommeke', 'test');
        }).then(function (response) {
          debug('reponse of GET of /partyrelations involved in the transaction');
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.results.length, 4);
        });
      });
    });
  });

  // TODO : Check that UPDATE on /transactionrelations is blocked.
  // TODO : Check that CREATE on /transactionrelations is blocked.

  // TODO : Check that update of balance on /partyrelations are ignored !
};
