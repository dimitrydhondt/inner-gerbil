/*eslint-env node, mocha */
var express = require('express');
var pg = require('pg');
var sri4node = require('sri4node');
var verbose = process.env.LOG_VERBOSE ? true : false; // eslint-disable-line
var app = express();
var mapping = require('../js/config.js')(sri4node, verbose);
var port = 5000;
var base = 'http://localhost:' + port;
//var base = 'https://inner-gerbil-test.herokuapp.com';
var c2 = require('../js/common.js');
var info = c2.info;
var error = c2.error;

describe('Inner gerbil : ', function () {
  'use strict';
  before(function (done) {
    sri4node.configure(app, pg, mapping).then(function () {
      app.set('port', port);
      app.listen(port, function () {
        info('Node app is running at localhost:' + port);
        done();
      });
    }).catch(function (err) {
      error('Unable to start server.');
      error(err);
      error(err.stack);
      done();
    });
  });

  require('./testTransactions.js')(base);
  require('./testTransactionCreate.js')(base);
  require('./testTransactionLimits.js')(base);
  require('./testContactdetails.js')(base);
  require('./testParties.js')(base);
  require('./testPartyAttachments.js')(base);
  require('./testMessages.js')(base);
  require('./testPlugins.js')(base);
  require('./elas-import/testImport.js')(base);
  require('./elas-import/testImportUsers.js')(base);
  require('./elas-import/testImportMessages.js')(base);

//  require('./testContactDetails.js')(base);
//  require('./testIsolated.js')(base);
});
