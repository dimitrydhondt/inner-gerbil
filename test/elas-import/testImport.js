/*eslint-env node, mocha */
var path = require('path');
var importer = require('../../elas-import/importer.js');

var PATH_TO_USERS_FILE = 'elas-users-2015-10-14.csv';

exports = module.exports = function (base, logverbose) {
  'use strict';

  function debug(x) {
    if (logverbose) {
      console.log(x); // eslint-disable-line
    }
  }
  describe('Elas import', function () {

    describe('CSV Importer', function () {
      it('should call function for each entry in CSV file', function () {
        logverbose = true;
        return importer(path.join(__dirname, PATH_TO_USERS_FILE), function (entry) {
          debug('importing...');
          debug(entry); //here is json object to import
          //return Promise.reject('it fails');
          return Promise.resolve('it succeeds');
        }).then(function () {
          debug('Test ended successfully');
        }).catch(function (err) {
          debug(err);
          throw err;
        }).done();
      });
    });
  });
};
