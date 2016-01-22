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

exports = module.exports = function (msg, partyUrl) {
  'use strict';
  var uuid = common.generateUUID();
  var alias = 'LM' + '-' + msg.id_user;
  return doGet(base + '/parties?alias=' + alias, 'annadv', 'test').then(function (responseGet) {
    var message;
    var user;
    if (responseGet.statusCode !== 200) {
      console.log('GET failed, response = ' + JSON.stringify(responseGet));
    } else {
      console.log('GET successful for user with alias ' + alias);

      if (responseGet.body.$$meta.count > 0) {
        user = responseGet.body.results[0].href;
      } else {
        console.log('No user found with alias ' + alias + ' -> skipping import of message ' + msg.content);
        return;
      }
      message = {
        author: {
          href: user
        },
        title: msg.content,
        description: msg.Description,
        amount: msg.amount,
        unit: msg.units,
        tags: [],
        photos: [],
        created: moment(msg.cdate),
        modified: moment(msg.cdate),
        expires: moment(msg.validity)
      };
      var messageparty = {
        message: {
          href: '/messages/' + uuid
        },
        party: {
          href: partyUrl
        }
      };
      var batchBody = [
        {
          href: '/messages/' + uuid,
          verb: 'PUT',
          body: message
          },
        {
          href: '/messageparties/' + common.generateUUID(),
          verb: 'PUT',
          body: messageparty
          }
          ];

      return doPut(base + '/batch', batchBody, 'annadv', 'test')
        .then(function (responsePut) {
            if (responsePut.statusCode !== 200 && responsePut.statusCode !== 201) {
              var errorMsg = 'PUT failed, response = ' + JSON.stringify(responsePut);
              console.log(errorMsg);
              throw Error(errorMsg);
            }
            console.log('PUT to messages and messageparties successful (batch=' + JSON.stringify(batchBody) + ')');
          },
          function (err) {
            console.log('Batch PUT failed');
            throw err;
          });
    }
  });
};
