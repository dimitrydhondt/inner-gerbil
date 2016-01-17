/*eslint-env node, mocha */

var express = require('express');
//var compress = require('compression');
var pg = require('pg');
var sri4node = require('sri4node');

var app = express();

var verbose = false;
var winston = require('winston');
winston.level = verbose ? 'debug' : 'info';

var mapping = require('../js/config.js')(sri4node, verbose, winston);
var port = 5000;
var base = 'http://localhost:' + port;
//var base = 'https://inner-gerbil-test.herokuapp.com';

function info(x) {
  'use strict';
  console.log(x); // eslint-disable-line
}

function error(x) {
  'use strict';
  if (verbose) {
    console.log(x); // eslint-disable-line
  }
}

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

  require('./testTransactions.js')(base, verbose);
  require('./testTransactionCreate.js')(base, verbose);
  require('./testTransactionLimits.js')(base, verbose);
  require('./testContactdetails.js')(base, verbose);
  require('./testParties.js')(base, verbose);
  require('./testPartyAttachments.js')(base, verbose);
  require('./testMessages.js')(base, verbose);
  require('./testPlugins.js')(base, verbose);
  require('./elas-import/testImport.js')(base, verbose);

//  require('./testPartyAttachments.js')(base, winston);
//  require('./testIsolated.js')(base, verbose);
});
