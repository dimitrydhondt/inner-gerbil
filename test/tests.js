/*eslint-env node, mocha */

var express = require('express');
//var compress = require('compression');
var pg = require('pg');
//var Q = require('q');
var assert = require('assert');

var sri4node = require('sri4node');
//var $u = sri4node.utils;
//var $m = sri4node.mapUtils;
//var $s = sri4node.schemaUtils;
//var $q = sri4node.queryUtils;

var sriclient = require('sri4node-client');
var doGet = sriclient.get;
//var doPut = sriclient.put;
//var doDelete = sriclient.delete;

var verbose = true;

function debug(x) {
  'use strict';
  if (verbose) {
    console.log(x);
  }
}

var app = express();
var mapping = require('../js/config.js')(sri4node, verbose);
var port = 5000;
app.set('port', port);
sri4node.configure(app, pg, mapping);
var base = 'http://localhost:' + port;


app.listen(port, function () {
  'use strict';
  debug('Node app is running at localhost:' + port);
});

describe('/parties', function () {
  'use strict';
  describe('GET', function () {
    it('should allow full list retrieval.', function () {
      return doGet(base + '/parties').then(function (response) {
        assert.equal(response.statusCode, 200);
        if (response.body.$$meta.count < 4) {
          assert.fail('Expected all parties');
        }
      });
    });

    it('should support parentsOf as URL parameter', function () {
      // Find parents of LETS Lebbeke, should return LETS Regio Dendermonde
      return doGet(base + '/parties?parentsOf=/parties/aca5e15d-9f4c-4c79-b906-f7e868b3abc5')
        .then(function (response) {
        assert.equal(response.statusCode, 200);
        assert.equal(response.body.$$meta.count, 1);
        assert.equal(response.body.results[0].href, '/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849');
      });
    });

    it('should support parentsOf with multiple parameters', function () {
      return doGet(base + '/parties?parentsOf=' +
                   '/parties/5df52f9f-e51f-4942-a810-1496c51e64db,/parties/fa17e7f5-ade9-49d4-abf3-dc3722711504')
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

    it('should support retrieving all reachable parties ?reachableFrom', function () {
      return doGet(base + '/parties?reachableFrom=/parties/5df52f9f-e51f-4942-a810-1496c51e64db')
        .then(function (response) {
        var hrefs = [];
        assert.equal(response.statusCode, 200);
        if (response.body.count < 4) {
          assert.fail('Expected all parties');
        }
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
        // Steven Buytinck
        if (hrefs.indexOf('/parties/fa17e7f5-ade9-49d4-abf3-dc3722711504') === -1) {
          assert.fail();
        }
      });
    });

    it('should support retrieving reachable parties for multiple start nodes', function () {
      return doGet(base + '/parties?reachableFrom=/parties/5df52f9f-e51f-4942-a810-1496c51e64db,' +
                   '/parties/fa17e7f5-ade9-49d4-abf3-dc3722711504')
        .then(function (response) {
        var hrefs = [];
        assert.equal(response.statusCode, 200);
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
        // Steven Buytinck
        if (hrefs.indexOf('/parties/fa17e7f5-ade9-49d4-abf3-dc3722711504') === -1) {
          assert.fail();
        }
        // Anna
        if (hrefs.indexOf('/parties/5df52f9f-e51f-4942-a810-1496c51e64db') === -1) {
          assert.fail();
        }
      });
    });

    it('should support retrieving all parties of type "person"', function () {
      return doGet(base + '/parties?type=person')
        .then(function (response) {
        assert.equal(response.statusCode, 200);
        if (response.body.count < 2) {
          assert.fail('Expected all parties');
        }
        assert.equal(response.body.results[0].$$expanded.type, 'person');
        assert.equal(response.body.results[1].$$expanded.type, 'person');
      });
    });
  });
});
