var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;
var common = require('./common.js');
var createHrefArray = common.createHrefArray;
var expect = require('chai').expect;
var c2 = require('../js/common.js');
var debug = c2.debug;
var uuid = require('uuid');

exports = module.exports = function (base) {
  'use strict';

  describe('/contactdetails', function () {
    describe('GET', function () {
      it('should be possible to add a phone for a party.', function () {
        var guidContactdetail = uuid.v4();
        var guidPartycontactdetail = uuid.v4();
        var batch = [
          {
            href: '/contactdetails/' + guidContactdetail,
            verb: 'PUT',
            body: {
              key: guidContactdetail,
              type: 'phone',
              value: '0492791058',
              public: true
            }
          },
          {
            href: '/partycontactdetails/' + guidPartycontactdetail,
            verb: 'PUT',
            body: {
              key: guidPartycontactdetail,
              contactdetail: {
                href: '/contactdetails/' + guidContactdetail
              },
              party: {
                href: common.hrefs.PARTY_GEERT
              }
            }
          }
        ];
        return doPut(base + '/batch', batch, 'geertg', 'test').then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 201);
          return doGet(base + '/contactdetails?forParties=' + common.hrefs.PARTY_GEERT, 'geertg', 'test');
        }).then(function (response) {
          debug(response.body);
          assert.equal(response.statusCode, 200);
          var hrefs = createHrefArray(response);
          expect(hrefs).to.contain('/contactdetails/' + guidContactdetail);
        });
      });
    });
  });
};
