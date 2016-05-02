/*eslint-env node, mocha */
var importTransactions = require('../../elas-import/importTransactions.js');
var common = require('../common.js');

//var validateTransaction = function (transaction, uuid, expectedTransaction) {
//  // FIXME: define what criteria to use to select created transaction(s)
//  return doGet(base + '/transactions/' + uuid, 'annadv', 'test').then(
//    function (
//      responseTrxn) {
//      if (responseTrxn.statusCode !== 200) {
//        debug('Error in get transaction: ' + responseTrxn.statusCode);
//      }
//      var trxns = responseTrxn.body;
//      if (trxns.$$meta.count === 0) {
//        debug('No transaction with uuid ' + uuid + ' found !!');
//        throw Error('No transaction with uuid ' + uuid + ' found');
//      }
//      debug('trxns=' + JSON.stringify(trxns));
//      var trxn = trxns.results[0].$$expanded;
//      debug(trxn);
//      if (typeof expectedTransaction != 'undefined' && expectedTransaction.from) {
//        assert.equal(trxn.from, expectedTransaction.from);
//      } else {
//        assert.equal(trxn.from, 'person');
//      }
//      if (typeof expectedTransaction != 'undefined' && expectedTransaction.to) {
//        assert.equal(trxn.to, expectedTransaction.to);
//      } else {
//        assert.equal(trxn.to, 'person');
//      }
//      if (typeof expectedTransaction != 'undefined' && expectedTransaction.amount) {
//        assert.equal(trxn.amount, expectedTransaction.amount);
//      } else {
//        assert.equal(trxn.amount, 'person');
//      }
//      if (typeof expectedTransaction != 'undefined' && expectedTransaction.description) {
//        assert.equal(trxn.description, expectedTransaction.description);
//      } else {
//        assert.equal(trxn.description, 'person');
//      }
//    });
//};

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
          cdate: '2016-05-02 22:36:33'
        };
        var groupAlias = 'LI';
        return importTransactions(transaction, common.hrefs.PARTY_LETSIMPORT, groupAlias).then(function () {
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
          cdate: '2011-04-26 22:36:33'
        };
        var groupAlias = 'LI';
        return importTransactions(transaction, common.hrefs.PARTY_LETSIMPORT, groupAlias).then(function () {
          // FIXME: add assertions to validate successful import of transaction
          //          return validateTransaction(transaction, groupAlias);
          //        }).then(function (party) {
          //          return validateTransactionRelation(party, regularUser, null);
        });
      });
      it('should allow zero transactions', function () {
        var groupAlias = 'LI';
        var transaction = {
          id: 979,
          id_from: 1, // eslint-disable-line
          id_to: 2, // eslint-disable-line
          amount: 0,
          description: 'ruil eierdoosjes tegen verse eitjes: bedankt',
          transid: 'b1f36c8e699423e38cbe1c70c2e83b1a01680439143@elas.letsmechelen.vsbnet.be',
          cdate: '2013-08-01 12:03:41'
        };
        return importTransactions(transaction, common.hrefs.PARTY_LETSIMPORT, groupAlias).then(function () {
          // FIXME: add assertions to validate successful import of transaction
          //          return validateTransaction(transaction, groupAlias);
          //        }).then(function (party) {
          //          return validateTransactionRelation(party, regularUser, null);
        });
      });
    });
  });
};
