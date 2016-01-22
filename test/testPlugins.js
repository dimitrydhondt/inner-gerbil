var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var common = require('./common.js');
var createHrefArray = common.createHrefArray;
var hrefs = common.hrefs;
var expect = require('chai').expect;
var c2 = require('../js/common.js');
var debug = c2.debug;

exports = module.exports = function (base) {
  'use strict';

  describe('/plugins', function () {
    describe('GET', function () {
      it('should allow full list retrieval.', function () {
        return doGet(base + '/plugins', 'annadv', 'test').then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var links = createHrefArray(response);
          expect(links).to.contain(hrefs.PLUGIN_MAIL);
        });
      });

      it('should be possible to retrieve 1 plugin on name', function () {
        return doGet(base + '/plugins?name=mail', 'annadv', 'test', function (response) {
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.$$meta.count, 1);
          var links = createHrefArray(response);
          assert.equal(links.length, 0);
          assert.equal(links[0].$$expanded.name, 'mail');
        });
      });
    });
  });

  describe('/pluginauthorisations', function () {
    describe('GET', function () {
      it('should find the authorisation for LETS dendermonde on plugin MAIL', function () {
        var url = base + '/pluginauthorisations?party=' +
            hrefs.PARTY_LETSDENDERMONDE +
            '&plugin=' + hrefs.PLUGIN_MAIL;
        return doGet(url, 'annadv', 'test').then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
        });
      });

      it('should not find any plugin authorisations on LETS Lebbeke', function () {
        var url = base + '/pluginauthorisations?party=' + hrefs.PARTY_LETSLEBBEKE + '&plugin=' + hrefs.PLUGIN_MAIL;
        debug(url);
        return doGet(url, 'annadv', 'test').then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          assert.equal(response.body.$$meta.count, 0);
        });
      });
    });
  });

  describe('/plugindata', function () {
    describe('GET', function () {
      it('should allow retrieval of data for mail plugin, on LETS Dendermonde', function () {
        var url = base + '/plugindata?resource=' + hrefs.PARTY_LETSDENDERMONDE + '&plugin=' + hrefs.PLUGIN_MAIL;
        debug('GET' + url);
        return doGet(url, 'annadv', 'test').then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var links = createHrefArray(response);
          assert.equal(links.length, 1);
          debug(links);
          assert.equal(links[0], '/plugindata/ebdd1d34-d11c-4950-a93e-fe76aa72a535');
        });
      });
    });
  });
};
