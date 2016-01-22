var common = require('./common.js');

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $q = sri4node.queryUtils;

  var ret = {
    type: '/messagerelations',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'A relationship between two messages. A message can be a response to another message,' +
        ' this response can be public (visible in the group), or private, etc...',
      type: 'object',
      properties: {
        key: {},
        from: {
          references: '/messages'
        },
        to: {
          references: '/messages'
        },
        type: {
          type: 'string',
          description: 'The type of relationship. Currently messages can be private or public responses to a ' +
            'top level message. For now reponses can not be given to other responses. This may be extended in the ' +
            'future.',
          enum: ['response_private', 'response_public']
        }
      },
      required: ['from', 'to', 'type']
    },
    validate: [],
    query: {
      to: $q.filterReferencedType('/messages', 'to'),
      defaultFilter: $q.defaultFilter
    },
    queryDocs: {
      to: 'Returns all responses to a (comma separated) list of messages.'
    },
    map: {
      from: {
        references: '/messages'
      },
      to: {
        references: '/messages'
      },
      type: {}
    },
    afterupdate: [],
    afterinsert: [],
    afterdelete: []
  };

  common.objectMerge(ret, extra);
  return ret;
};
