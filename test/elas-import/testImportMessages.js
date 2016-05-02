/*eslint-env node, mocha */
var path = require('path');
var Q = require('q');
var deferred = Q.defer();
var importer = require('../../elas-import/importer.js');
var importMessage = require('../../elas-import/importMessages.js');
//var assert = require('chai').assert;
var common = require('../common.js');
var debug = require('../../js/common.js').debug;
var sriclient = require('sri4node-client');
var doGet = sriclient.get;

var PATH_TO_MSGS_FILE = 'elas-messages-2015-10-26.csv';

exports = module.exports = function (base) {
  'use strict';

  describe('Elas import', function () {

    describe('Messages', function () {
      it('should load messages from CSV file', function () {
        //return messagesImporter(path.join(__dirname, PATH_TO_MSGS_FILE), common.hrefs.PARTY_LETSDENDERMONDE)
        return importer(path.join(__dirname, PATH_TO_MSGS_FILE), function (message) {
          return importMessage(message, common.hrefs.PARTY_LETSIMPORT);
        }).then(function () {
          // Get and validate imported message
          // TODO: filter get to return newly inserted message
          return doGet(base + '/messages', 'annadv', 'test').then(function (response) {
            var messages = response.body;
            debug(messages);
            var message = messages.results[0].$$expanded;
            debug(message);
            // TODO: match assertions with inserted messages
            //assert.equal(message.title, '100');
            //assert.equal(message.description, 'test message');
          });
        }).catch(function (err) {
          debug('error: ' + err);
        });
      });
      it('should accept null amount', function () {
        var groupAlias = 'LI';
        var message = {
          id: '2191',
          id_user: '1', // eslint-disable-line
          content: 'plastieken papfles',
          Description: 'wie heeft er per toeval zo\'n plastieken papfles liggen',
          amount: '\\N',
          units: 'stuk',
          msg_type: '0', // eslint-disable-line
          id_category: '18', // eslint-disable-line
          cdate: '2014-06-10 17:52:34',
          mdate: '\\N',
          validity: '2014-07-10 17:52:34'
        };
        return importMessage(message, common.hrefs.PARTY_LETSIMPORT, groupAlias).then(function () {
          debug('import completed');
        });
      });
      it('should accept any value as unit', function () {
        var groupAlias = 'LI';
        var message = {
          id: '1466',
          id_user: '2', // eslint-disable-line
          content: 'scharreleitjes 6 voor 5 blussers',
          Description: '',
          amount: '5',
          units: 6,
          msg_type: '1', // eslint-disable-line
          id_category: '15', // eslint-disable-line
          cdate: '2013-06-13 21:09:45',
          mdate: '2013-06-27 14:33:05',
          validity: '2018-06-01 14:33:05'
        };
        return importMessage(message, common.hrefs.PARTY_LETSIMPORT, groupAlias).then(function () {
          debug('import completed');
        });

      });
      it.skip('should not fail with TypeError', function () {
        // Increase loop to 100 to reproduce the error
        var jsonObj = {
          id: 28,
          id_user: 3, // eslint-disable-line
          content: 'Te leen: Franstalige strips voor volwassenen',
          Description: 'Heb strips liggen van Garulfo, Largo Winch, Lanfeust de Troy in de franstalige versie.',
          amount: 5,
          units: 'week',
          msg_type: 1, // eslint-disable-line
          id_category: 37, // eslint-disable-line
          cdate: '2011-04-03 22:51:29',
          mdate: '2014-02-15 19:42:55',
          validity: '2015-02-10 19:42:55'
        };
        var hrefs = {
          PARTY_LETSDENDERMONDE: '/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849'
        };
        var importMethod = function (message) {
          return importMessage(message, hrefs.PARTY_LETSIMPORT);
        };

        var logEndImport = function () {
          debug('End import');
        };
        var logImportError = function (error) {
          debug('Import failed with error: ' + error + ' (jsonObj=' + JSON.stringify(
              jsonObj) +
            ')');
          throw error;
        };
        var promises = [];
        var i = 0;
        for (i = 0; i < 1; i++) {
          debug('Start import');
          promises.push(importMethod(jsonObj).then(logEndImport).catch(logImportError));
        }
        return Q.all(promises).then(function () {
          deferred.resolve();
        }).catch(function (e) {
          debug('Q.all failed !');
          debug(e);
          throw e;
        });
      });
    });
  });
};
