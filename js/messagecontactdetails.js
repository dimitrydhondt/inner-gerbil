var common = require('./common.js');

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  var ret = {
    type: '/messagecontactdetails',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'Messages can have contact details associated. These are scoped in the lifetime of the message.',
      type: 'object',
      properties: {
        message: $s.permalink('/messages', 'The message the contactdetail belongs to.'),
        contactdetail: $s.permalink('/contactdetails', 'The contactdetail that is associated with the message.')
      },
      required: ['message', 'contactdetail']
    },
    map: {
      key: {},
      message: {
        references: '/messages'
      },
      contactdetail: {
        references: '/contactdetails'
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
