var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;
var common = require('./common.js');
var createHrefArray = common.createHrefArray;
var expect = require('chai').expect;
var c2 = require('../js/common.js');
var debug = c2.debug;

exports = module.exports = function (base) {
  'use strict';

  describe('/parties', function () {
    describe('GET', function () {
      it('should allow full list retrieval.', function () {
        return doGet(base + '/parties', 'annadv', 'test').then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          if (response.body.$$meta.count < 4) {
            assert.fail('Expected all parties');
          }
        });
      });

      it('should support ancestorsOfParties as URL parameter', function () {
        // Find parents of LETS Lebbeke, should return LETS Regio Dendermonde
        return doGet(base + '/parties?ancestorsOfParties=' +
            '/parties/aca5e15d-9f4c-4c79-b906-f7e868b3abc5', 'annadv', 'test')
          .then(function (response) {
            assert.equal(response.statusCode, 200);
            assert.equal(response.body.$$meta.count, 1);
            assert.equal(response.body.results[0].href, '/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849');
          });
      });

      it('should support ancestorsOfParties with multiple parameters', function () {
        return doGet(base + '/parties?ancestorsOfParties=' +
            '/parties/5df52f9f-e51f-4942-a810-1496c51e64db,' +
            '/parties/fa17e7f5-ade9-49d4-abf3-dc3722711504', 'annadv', 'test')
          .then(function (response) {
            var hrefs = [];
            assert.equal(response.statusCode, 200);
            assert.equal(response.body.$$meta.count, 2);
            response.body.results.forEach(function (item) {
              hrefs.push(item.href);
            });
            // LETS Dendermonde
            if (hrefs.indexOf('/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849') === -1) {
              assert.fail();
            }
            // LETS Lebbeke
            if (hrefs.indexOf('/parties/aca5e15d-9f4c-4c79-b906-f7e868b3abc5') === -1) {
              assert.fail();
            }
          });
      });

      it('should support retrieving all reachable parties ?reachableFromParties', function () {
        return doGet(base + '/parties?reachableFromParties=' +
            common.hrefs.PARTY_ANNA, 'annadv', 'test')
          .then(function (response) {
            var hrefs = [];
            assert.equal(response.statusCode, 200);
            if (response.body.count < 4) {
              assert.fail('Expected all parties');
            }
            hrefs = common.createHrefArray(response);

            expect(hrefs).to.contain(common.hrefs.PARTY_LETSDENDERMONDE);
            expect(hrefs).to.contain(common.hrefs.PARTY_LETSLEBBEKE);
            expect(hrefs).to.contain(common.hrefs.PARTY_STEVEN);
          });
      });

      it('should support retrieving reachable parties for multiple start nodes', function () {
        return doGet(base + '/parties?reachableFromParties=' +
            common.hrefs.PARTY_ANNA + ',' +
            common.hrefs.PARTY_STEVEN, 'annadv', 'test')
          .then(function (response) {
            var hrefs = [];
            assert.equal(response.statusCode, 200);
            hrefs = common.createHrefArray(response);

            expect(hrefs).to.contain(common.hrefs.PARTY_LETSDENDERMONDE);
            expect(hrefs).to.contain(common.hrefs.PARTY_LETSLEBBEKE);
            // Eddy is inactive in LETS Lebbeke, so should not be found..
            expect(hrefs).to.not.contain(common.hrefs.PARTY_EDDY);
            expect(hrefs).to.contain(common.hrefs.PARTY_RUDI);

            // TODO ! When using multiple roots, root A can be reachable from root B, and vice-versa...
            // This does not work correclty now. It does work correctly for a single root.
            // Steven is reachable from Anna !
            //expect(hrefs).to.contain(common.hrefs.PARTY_STEVEN);
            // Anna is reachable from Steven !
            //expect(hrefs).to.contain(common.hrefs.PARTY_ANNA);
          });
      });

      it('should support retrieving all parties of type "person"', function () {
        return doGet(base + '/parties?type=person', 'annadv', 'test')
          .then(function (response) {
            assert.equal(response.statusCode, 200);
            if (response.body.count < 2) {
              assert.fail('Expected all parties');
            }
            assert.equal(response.body.results[0].$$expanded.type, 'person');
            assert.equal(response.body.results[1].$$expanded.type, 'person');
          });
      });

      it('should support retrieve all children below 1 node', function () {
        return doGet(base + '/parties?descendantsOfParties=' +
            '/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849', 'annadv', 'test')
          .then(function (response) {
            var hrefs = [];
            assert.equal(response.statusCode, 200);
            response.body.results.forEach(function (item) {
              hrefs.push(item.href);
            });

            // LETS Lebbeke
            expect(hrefs).to.contain('/parties/aca5e15d-9f4c-4c79-b906-f7e868b3abc5');
            // Steven Buytinck
            expect(hrefs).to.contain('/parties/fa17e7f5-ade9-49d4-abf3-dc3722711504');
            // Anna
            expect(hrefs).to.contain('/parties/5df52f9f-e51f-4942-a810-1496c51e64db');
          });
      });

      it('should support retrieve all children below 1 node & of a certain type', function () {
        return doGet(base + '/parties?descendantsOfParties=' +
            '/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849&type=person', 'annadv', 'test')
          .then(function (response) {
            var hrefs = [];
            assert.equal(response.statusCode, 200);
            response.body.results.forEach(function (item) {
              hrefs.push(item.href);
            });

            // LETS Lebbeke should be ABSENT
            expect(hrefs).not.to.contain('/parties/aca5e15d-9f4c-4c79-b906-f7e868b3abc5');
            // Steven Buytinck
            expect(hrefs).to.contain('/parties/fa17e7f5-ade9-49d4-abf3-dc3722711504');
            // Anna
            expect(hrefs).to.contain('/parties/5df52f9f-e51f-4942-a810-1496c51e64db');
          });
      });

      it('should support ?forMessages=...', function () {
        return doGet(base + '/parties?forMessages=' +
            '/messages/e24528a5-b12f-417a-a489-913d5879b895', 'annadv', 'test')
          .then(function (response) {
            debug(response.body);
            assert.equal(response.statusCode, 200);
            assert.equal(response.body.results[0].href, '/parties/0a98e68d-1fb9-4a31-a4e2-9289ee2dd301');
          });
      });

      it('should support ?inLatLong=...', function () {
        return doGet(base + '/parties?inLatLong=50.9,51.0,4.1,4.2', 'annadv', 'test').then(function (
          response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain(common.hrefs.PARTY_ANNA);
          expect(hrefs).to.contain(common.hrefs.PARTY_LETSDENDERMONDE);
          expect(hrefs).to.not.contain(common.hrefs.PARTY_LETSLEBBEKE);
          expect(hrefs).to.not.contain(common.hrefs.PARTY_LETSHAMME);
        });
      });
    });
    describe('PUT', function () {
      it('should allow insertion of new party.', function () {
        var body = {
          type: 'person',
          name: 'test user',
          status: 'active'
        };
        var uuid = common.generateUUID();
        debug('Generated UUID=' + uuid);
        return doPut(base + '/parties/' + uuid, body, 'annadv', 'test').then(
          function (response) {
            assert.equal(response.statusCode, 201);
            return doGet(base + '/parties/' + uuid, 'annadv', 'test').then(
              function (response2) {
                assert.equal(response2.statusCode, 200);
                var party = response2.body;
                assert.equal(party.type, 'person');
                assert.equal(party.name, 'test user');
                assert.equal(party.status, 'active');
              });
          });
      });

      it('should update party.', function () {
        return doGet(base + common.hrefs.PARTY_ANNA, 'annadv', 'test').then(function (response) {
          debug(response.body);
          var p = response.body;
          p.alias = 'myAlias';
          return doPut(base + common.hrefs.PARTY_ANNA, p, 'annadv', 'test');
        }).then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          return doGet(base + common.hrefs.PARTY_ANNA, 'annadv', 'test');
        }).then(function (response) {
          var party = response.body;
          assert.equal(party.alias, 'myAlias');
        });
      });
    });
  });
};
