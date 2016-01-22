var common = require('./common.js');

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  var ret = {
    type: '/pluginauthorisations',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'An authorisation giving a certain plugin access ' +
        'to the information of the party that granted authorisation.',
      type: 'object',
      properties: {
        plugin: $s.permalink('/plugins', 'The plugin that is granted access'),
        party: $s.permalink('/parties', 'The party\'s information being granted access to')
      },
      required: ['plugin', 'party']
    },
    map: {
      key: {},
      plugin: {references: '/plugins'},
      party: {references: '/parties'}
    },
    validate: [],
    query: {
      plugin: $q.filterReferencedType('/plugins', 'plugin'),
      party: $q.filterReferencedType('/parties', 'party'),
      defaultFilter: $q.defaultFilter
    },
    queryDocs: {
      plugin: 'Limit the list to authorisations for one plugin only. ' +
        'You can filter on more than one plugin by comma separating multiple permalinks.',
      party: 'Limit the list to authorisations for a party. ' +
        'You can filter on more than one plugin by comma-separating multiple permalinks.'
    },
    afterupdate: [],
    afterinsert: [],
    afterdelete: []
  };

  common.objectMerge(ret, extra);
  return ret;
};
