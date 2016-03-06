var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var common = require('./common.js');
var createHrefArray = common.createHrefArray;
var expect = require('chai').expect;
var c2 = require('../js/common.js');
var debug = c2.debug;

exports = module.exports = function (base) {
  'use strict';

  describe('/contactdetails', function () {
    describe('GET', function () {
      it('should allow full list retrieval.', function () {
        return doGet(base + '/contactdetails', 'annadv', 'test').then(function (response) {
          assert.equal(response.statusCode, 200);
          if (response.body.$$meta.count < 3) {
            assert.fail('Expected all contactdetails');
          }
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain('/contactdetails/843437b3-29dd-4704-afa8-6b06824b2e92');
          expect(hrefs).to.contain('/contactdetails/b059ef61-340c-45d8-be4f-02436bcc03d9');
          expect(hrefs).to.contain('/contactdetails/96de9531-d777-4dca-9997-7a774d2d7595');
        });
      });

      it('should support ?forMessages=', function () {
        return doGet(base + '/contactdetails?forMessages=' +
                     '/messages/d1c23a0c-4420-4bd3-9fa0-d542b0155a15', 'annadv', 'test')
          .then(function (response) {
            debug(response.body);
            assert.equal(response.statusCode, 200);
            assert.equal(response.body.results[0].href, '/contactdetails/3362d325-cf19-4730-8490-583da50e114e');
          });
      });

      it('should support ?forDescendantsOfParties=', function () {
        return doGet(base + '/contactdetails?forDescendantsOfParties=' + common.hrefs.PARTY_LETSDENDERMONDE,
                    'annadv', 'test').then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_ANNA); // address for anna
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_ANNA); // email anna
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_STEVEN); // address for steven
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_STEVEN); // email steven
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_RUDI); // email rudi
          // Only descendants, so not LETS_DENDERMONDE itself...
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_LETSDENDERMONDE); // address LETS Dendermonde.
          // address for event. (non-party contactdetail)
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_MESSAGE);
        });
      });

      it('should support ?forDescendantsOfParties=', function () {
        return doGet(base + '/contactdetails?forDescendantsOfParties=' + common.hrefs.PARTY_LETSLEBBEKE,
                    'annadv', 'test')
          .then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_ANNA); // address for anna
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_ANNA); // email anna
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_STEVEN); // address for steven
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_STEVEN); // email steven
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_RUDI); // email rudi
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_LETSDENDERMONDE); // address LETS Dendermonde.
          // address for event. (non-party contactdetail)
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_MESSAGE);
        });
      });

      it('should support ?forPartiesReachableFromParties=', function () {
        return doGet(base + '/contactdetails?forPartiesReachableFromParties=' + common.hrefs.PARTY_ANNA,
                    'annadv', 'test')
          .then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          // No contactetails for Anna, as reachableFromParties excludes it's initial root (anna)
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_ANNA); // address for anna
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_ANNA); // email anna

          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_STEVEN); // address for steven
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_STEVEN); // email steven
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_RUDI); // email rudi
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_LETSDENDERMONDE); // address LETS Dendermonde.

          // address for event. (non-party contactdetail)
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_MESSAGE);
        });
      });

      it('should support ?forAncestorsOfParties=', function () {
        return doGet(base + '/contactdetails?forAncestorsOfParties=' + common.hrefs.PARTY_ANNA,
                    'annadv', 'test')
          .then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          // No contactetails for Anna, as reachableFromParties excludes it's initial root (anna)
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_ANNA); // address for anna
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_ANNA); // email anna
          // No contact details of the other members of LETS Dendermonde
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_STEVEN); // address for steven
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_STEVEN); // email steven
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_RUDI); // email rudi

          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_LETSDENDERMONDE); // address LETS Dendermonde.

          // address for event. (non-party contactdetail)
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_MESSAGE);
        });
      });

      it('should support ?forParentsOfParties=x,y,z', function () {
        return doGet(base + '/contactdetails?forParentsOfParties=' + common.hrefs.PARTY_ANNA,
                    'annadv', 'test')
          .then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          // No contactetails for Anna
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_ANNA); // address for anna
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_ANNA); // email anna
          // No contact details of the other members of LETS Dendermonde
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_STEVEN); // address for steven
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_STEVEN); // email steven
          // Rudi is a direct member of LETS Dendermonde
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_RUDI); // email rudi
          // No contact details of parent-of-parent
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_LETSDENDERMONDE); // address LETS Dendermonde.
          // address for event. (non-party contactdetail)
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_MESSAGE);
        });
      });

      it('should support ?forParentsOfParties=x,y,z', function () {
        return doGet(base + '/contactdetails?forParentsOfParties=' + common.hrefs.PARTY_LETSLEBBEKE,
                    'annadv', 'test')
          .then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          // No contactetails for Anna
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_ANNA); // address for anna
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_ANNA); // email anna
          // No contact details of the other members of LETS Dendermonde
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_STEVEN); // address for steven
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_STEVEN); // email steven
          // Rudi is a direct member of LETS Dendermonde.
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_RUDI); // email rudi
          // SHould have address for LETS Dendermonde.
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_LETSDENDERMONDE); // address LETS Dendermonde.
          // address for event. (non-party contactdetail)
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_MESSAGE);
        });
      });

      it('should support ?forChildrenOfParties=x,y,z', function () {
        return doGet(base + '/contactdetails?forChildrenOfParties=' + common.hrefs.PARTY_LETSLEBBEKE,
                    'annadv', 'test')
          .then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          // All contactdetails for direct children : anna, steven & rudi.
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_ANNA); // address for anna
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_ANNA); // email anna
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_ADDRESS_STEVEN); // address for steven
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_STEVEN); // email steven
          // Rudi is direct member of LETS Dendermonde
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_RUDI); // email rudi
          // No parents, obviously
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_LETSDENDERMONDE); // address LETS Dendermonde.
          // No event contactdetails, obviously
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_MESSAGE);
        });
      });

      it('should support ?forChildrenOfParties=x,y,z', function () {
        return doGet(base + '/contactdetails?forChildrenOfParties=' + common.hrefs.PARTY_LETSDENDERMONDE,
                    'annadv', 'test')
          .then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          // No contactetails for indirect children of LETS Dendermonde
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_ANNA); // address for anna
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_ANNA); // email anna
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_STEVEN); // address for steven
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_EMAIL_STEVEN); // email steven
          // Rudi is a direct member of LETS Dendermonde, so expect his details.
          expect(hrefs).to.contain(common.hrefs.CONTACTDETAIL_EMAIL_RUDI); // email rudi
          // No contact details of LETS Dendermonde itself.
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_LETSDENDERMONDE); // address LETS Dendermonde.
          // No contact details of messages.
          expect(hrefs).to.not.contain(common.hrefs.CONTACTDETAIL_ADDRESS_MESSAGE);
        });
      });

    });
  });
};
