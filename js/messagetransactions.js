var common = require('./common.js');

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  var ret = {
    type: '/messagetransactions',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'Expresses that a certain message has a certain transaction associated with it. ' +
      'One message can have multiple /messagetransactions, and as such have many transactions ' +
      'associated with it.',
      type: 'object',
      properties: {
        message: $s.permalink('/messages', 'The message.'),
        transaction: $s.permalink('/transactions', 'The related transaction.')
      },
      required: ['message', 'transaction']
    },
    map: {
      key: {},
      message: {
        references: '/messages'
      },
      transaction: {
        references: '/transactions'
      }
    },
    validate: [],
    query: {
      defaultFilter: $q.defaultFilter
    },
    afterupdate: [],
    afterinsert: [],
    afterdelete: []
  };

  common.objectMerge(ret, extra);
  return ret;
};
