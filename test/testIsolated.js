var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;
var moment = require('moment');
var common = require('./common.js');
var createHrefArray = common.createHrefArray;
var expect = require('chai').expect;
var c2 = require('../js/common.js');
var debug = c2.debug;

exports = module.exports = function (base) {
  'use strict';

  describe('/messages', function () {
    describe('GET', function () {
      it('should allow full list retrieval.', function () {
        return doGet(base + '/messages', 'annadv', 'test').then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          if (response.body.$$meta.count < 6) {
            assert.fail('Expected all messages');
          }
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain(common.hrefs.MESSAGE_ANNA_ASPERGES);
          expect(hrefs).to.contain(common.hrefs.MESSAGE_ANNA_CHUTNEY);
          expect(hrefs).to.contain(common.hrefs.MESSAGE_ANNA_VEGGIE_KOOKLES);
          expect(hrefs).to.contain(common.hrefs.MESSAGE_ANNA_ASPERGES);
          expect(hrefs).to.contain(common.hrefs.MESSAGE_STEVEN_INDISCH);
          expect(hrefs).to.contain(common.hrefs.MESSAGE_STEVEN_SWITCH);
          expect(hrefs).to.contain(common.hrefs.MESSAGE_LEEN_PLANTS);
          expect(hrefs).to.contain(common.hrefs.MESSAGE_RUDI_WEBSITE);
        });
      });
    });
  });
};
