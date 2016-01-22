var assert = require('assert');
var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;
var common = require('./common.js');
var needle = require('needle');
var Q = require('q');
var c2 = require('../js/common.js');
var debug = c2.debug;

exports = module.exports = function (base) {
  'use strict';

  function doPutFile(url, filename, user, pwd) {
    var deferred = Q.defer();

    var options = {};
    if (user && pwd) {
      options.username = user;
      options.password = pwd;
    }
    options.multipart = true;

    var data = {
      foo: 'bar',
      image: {file: filename, content_type: 'image/png'} // eslint-disable-line
    };

    needle.put(url, data, options, function (error, response) {
      if (!error) {
        deferred.resolve(response);
      } else {
        deferred.reject(error);
      }
    });

    return deferred.promise;
  }

  // Only basic test case for attachments, assuming sri4node-attachments is covered.
  describe('/parties', function () {
    describe('PUT', function () {
      it('should allow adding of profile picture as attachment.', function () {
        var body = {
          type: 'person',
          name: 'test user',
          status: 'active'
        };
        var uuid = common.generateUUID();

        debug('Generated UUID=' + uuid);
        return doPut(base + '/parties/' + uuid, body, 'annadv', 'test').then(function (response) {
          assert.equal(response.statusCode, 201);
          debug('PUTting the profile image as attachment.');
          var file = 'test/orange-boy-icon.png';
          return doPutFile(base + '/parties/' + uuid + '/profile.png', file, 'annadv', 'test');
        }).then(function (response) {
          assert.equal(response.statusCode, 201);
          return doGet(base + '/parties/' + uuid + '/profile.png', 'annadv', 'test');
        }).then(function (response) {
          debug('Retrieving of file done');
          debug('status code : ' + response.statusCode);
          debug('body length : ' + response.body.length);
          assert.equal(response.statusCode, 200);
          if (response.body.length && response.body.length < 10000) {
            assert.fail('Response too small, it should be the 10.x Kb image we sent...');
          }
        });
      });
    });
  });
};
