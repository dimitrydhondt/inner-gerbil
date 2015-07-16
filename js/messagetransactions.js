exports = module.exports = function (sri4node) {
  'use strict';
  var $s = sri4node.schemaUtils;

  return {
    type: '/messagetransactions',
    'public': true, // eslint-disable-line
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'When a transaction is created, and we know it relates to a certain message,' +
        ' we create one or more /messagetransactions resource.',
      type: 'object',
      properties: {
        message: $s.permalink('/messages', 'The message.'),
        transaction: $s.permalink('/transactions', 'The related transaction.')
      },
      required: ['message', 'transaction']
    },
    map: {
      message: {
        references: '/messages'
      },
      transaction: {
        references: '/transactions'
      }
    },
    validate: [],
    query: {},
    afterupdate: [],
    afterinsert: [],
    afterdelete: []
  };
};
