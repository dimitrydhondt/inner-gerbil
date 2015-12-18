/*eslint-env node, mocha */

var express = require('express');
//var compress = require('compression');
var pg = require('pg');

var sri4node = require('sri4node');
var common = require('./common.js');
var cl = common.cl;

var verbose = false;

var app = express();
var mapping = require('../js/config.js')(sri4node, verbose);
var port = 5000;
var base = 'http://localhost:' + port;

describe('Inner gerbil testing', function () {
  'use strict';
  before(function (done) {
    sri4node.configure(app, pg, mapping).then(function () {
      app.set('port', port);
      app.listen(port, function () {
        cl('Node app is running at localhost:' + port);
        done();
      });
    });
  });

  require('./testTransactions.js')(base, verbose);
  require('./testTransactionCreate.js')(base, verbose);
  require('./testContactdetails.js')(base, verbose);
  require('./testParties.js')(base, verbose);
  require('./testMessages.js')(base, verbose);
  require('./testPlugins.js')(base, verbose);
  require('./elas-import/testImport.js')(base, verbose);
  //require('./testIsolated.js')(base, verbose);
});
