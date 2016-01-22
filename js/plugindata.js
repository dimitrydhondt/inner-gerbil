var common = require('./common.js');

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  var ret = {
    type: '/plugindata',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'A piece of custom storage for a plugin. ' +
        'Plugins can store custom information about any resource in the system.',
      type: 'object',
      properties: {
        plugin: $s.permalink('/plugins', 'The plugin that is storing the information'),
        resource: $s.string('A permalink to any resource in the system'),
        data: $s.string('Any json data structure the plugin stores')
      },
      required: ['plugin', 'resource', 'data']
    },
    map: {
      key: {},
      plugin: {references: '/plugins'},
      resource: {},
      data: {}
    },
    validate: [],
    query: {
      plugin: $q.filterReferencedType('/plugins', 'plugin'),
      defaultFilter: $q.defaultFilter
    },
    queryDocs: {
      plugin: 'Limit the list to data for one plugin only. ' +
        'You can filter on more than one plugin by comma separating multiple permalinks.',
      resource: 'Limit the list to data for a specific resource. '
    },
    afterupdate: [],
    afterinsert: [],
    afterdelete: []
  };

  common.objectMerge(ret, extra);
  return ret;
};
