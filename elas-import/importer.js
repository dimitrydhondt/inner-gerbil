/*eslint-env node*/
var moment = require('moment');
var common = require('../test/common.js');
var Q = require('q');
var deferred = Q.defer();

var port = 5000;
var base = 'http://localhost:' + port;

var sriclient = require('sri4node-client');
var doGet = sriclient.get;
var doPut = sriclient.put;

// Importer expects
// fileName: CSV file to import
// importMethod: method to import one row of the file and returning a promise
exports = module.exports = function (fileName, importMethod) {
  'use strict';

  var promises = [];

  //Converter Class
  var Converter = require('csvtojson').Converter;
  var converter = new Converter({});

  // record_parsed will be emitted each csv row being processed
  converter.on('record_parsed', function (jsonObj) {
    console.log('record parsed event triggered');
    console.log('Start import');
    promises.push(importMethod(jsonObj).then(function () {
      console.log('End import');
    }).catch(function (error) {
      console.log('Import failed with error: ' + error);
    }));
  });

  // end_parsed will be emitted once parsing finished
  converter.on('end_parsed', function (jsonArray) {
    return Q.all(promises).then(function () {
      deferred.resolve();
    });
  });

  //read from file
  console.log('Reading file: ' + fileName);
  require('fs').createReadStream(fileName).pipe(converter);
  return deferred.promise;
};
