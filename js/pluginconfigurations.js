var common = require('./common.js');

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  var ret = {
    type: '/pluginconfigurations',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'A configuration of a plugin for a specific party.',
      type: 'object',
      properties: {
        plugin: $s.permalink('/plugins', 'The plugin that is being configured'),
        party: $s.permalink('/parties', 'The party this configuration belongs to'),
        data: $s.string('A json configuration object')
      },
      required: ['plugin', 'party', 'data']
    },
    map: {
      key: {},
      plugin: {references: '/plugins'},
      party: {references: '/parties'},
      data: {}
    },
    validate: [],
    query: {
      plugin: $q.filterReferencedType('/plugins', 'plugin'),
      party: $q.filterReferencedType('/parties', 'party'),
      defaultFilter: $q.defaultFilter
    },
    queryDocs: {
      plugin: 'Limit the list to configurations for one plugin only. ' +
        'You can filter on more than one plugin by comma separating multiple permalinks.',
      party: 'Limit the list to configuration for one party only. ' +
        'You can filter on more than one plugin by comma separating multiple permalinks.'
    },
    afterupdate: [],
    afterinsert: [],
    afterdelete: []
  };

  common.objectMerge(ret, extra);
  return ret;
};
