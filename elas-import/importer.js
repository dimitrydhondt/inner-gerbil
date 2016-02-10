/*eslint-env node*/
var common = require('../js/common.js');
var debug = common.debug;
var info = common.info;
var error = common.error;
var Q = require('q');
var deferred = Q.defer();

// Importer expects
// fileName: CSV file to import
// importMethod: method to import one row of the file and returning a promise
exports = module.exports = function (fileName, importMethod) {
  'use strict';

  var readableStream;
  var errorCount = 0;

  //Converter Class
  var Converter = require('csvtojson').Converter;
  var async = require('async');

  //read from file
  info('Reading file: ' + fileName);
  readableStream = require('fs').createReadStream(fileName);
  var q = async.queue(function (json, callback) {
      //process the json asynchronously
      debug('Start import');
      debug(json);
      return importMethod(json).then(function () {
        debug('End import');
        callback();
      }).fail(function (err) {
        debug('Import failed with error: ' + err + ' (json=' + JSON.stringify(json) + ')');
        errorCount += 1;
        callback();
      });
    },
    5); //5 concurrent worker same time
  q.saturated = function () {
    debug('saturated called, running: ' + q.running() + ' waiting: ' + q.length());
    // if queue is full, it is suggested to pause the readstream so csvtojson will suspend populating json data.
    // It is ok to not to do so if CSV data is not very large.
    readableStream.pause();
    debug('paused?' + readableStream.isPaused());
  };
  q.empty = function () {
    debug('empty called, running: ' + q.running() + ' waiting: ' + q.length());
    // Resume the paused readable stream.
    // You may need check if the readable stream isPaused() (this is since node 0.12) or finished.
    readableStream.resume();
    debug('paused?' + readableStream.isPaused());
  };

  var converter = new Converter({
    constructResult: false,
    delimiter: '\t'
  });

  // record_parsed will be emitted each csv row being processed
  converter.on('record_parsed', function (json) {
    debug('record_parsed event triggered');
    q.push(json, function (err) {
      if (err) {
        error('Error in import of json ' + json + ' : ' + err);
      }
      debug('finished processing json ' + JSON.stringify(json));
    });
  });

  // end_parsed will be emitted once parsing finished
  converter.on('end_parsed', function () {
    debug('end_parsed event triggered');
    debug('Waiting? ' + q.length());
    debug('Still running? ' + q.running());
    q.drain = function () {
      debug('drain method called');
      if (errorCount === 0) {
        deferred.resolve();
      } else {
        info('Errors occured during import: ' + errorCount);
        deferred.reject(new Error('Import errors: ' + errorCount));
      }
    };
  });

  readableStream.pipe(converter);
  return deferred.promise;
};
