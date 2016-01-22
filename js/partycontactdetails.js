var common = require('./common.js');

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  var ret = {
    type: '/partycontactdetails',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'Parties can have contact details associated. These are scoped in the lifetime of the party.',
      type: 'object',
      properties: {
        party: $s.permalink('/parties', 'The party the contactdetail belongs to.'),
        contactdetail: $s.permalink('/contactdetails', 'The contactdetail that is associated with the party.')
      },
      required: ['party', 'contactdetail']
    },
    map: {
      key: {},
      party: {
        references: '/parties'
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
