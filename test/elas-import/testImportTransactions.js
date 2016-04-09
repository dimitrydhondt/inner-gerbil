/*eslint-env node, mocha */
var importTransactions = require('../../elas-import/importTransactions.js');
//var assert = require('assert');
//var assert = require('chai').assert;
//var common = require('../common.js');
//var debug = require('../../js/common.js').debug;

exports = module.exports = function () {
  'use strict';
  describe('Elas import', function () {

    describe('Transactions', function () {

      it('should import a transaction', function () {

        var transaction = {
          id: 687,
          id_from: 1, // eslint-disable-line
          id_to: 2, // eslint-disable-line
          amount: 10,
          description: 'Ikea rekje',
          transid: 'abcdefghij1@elas.vsbnet.be'
        };
        var groupAlias = 'LI';
        return importTransactions(transaction, groupAlias).then(function () {
          // FIXME: add assertions to validate successful import of transaction
          //          return validateTransaction(transaction, groupAlias);
          //        }).then(function (party) {
          //          return validateTransactionRelation(party, regularUser, null);
        });
      });
      it('should import an admin transaction', function () {
        // In inner-gerbil, admin users have 2 links with the group (admin link and normal link)
        // The admin link may not be used to create transactions

        var transaction = {
          id: 687,
          id_from: 100, // eslint-disable-line
          id_to: 2, // eslint-disable-line
          amount: 20,
          description: 'ledenbijdrage 2011',
          transid: 'abcdefghij2@elas.vsbnet.be'
        };
        var groupAlias = 'LI';
        return importTransactions(transaction, groupAlias).then(function () {
          // FIXME: add assertions to validate successful import of transaction
          //          return validateTransaction(transaction, groupAlias);
          //        }).then(function (party) {
          //          return validateTransactionRelation(party, regularUser, null);
        });
      });

    });
  });
};
