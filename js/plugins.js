var Q = require('q');
var common = require('./common.js');

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $m = sri4node.mapUtils,
    $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  function notfound() {
    var defer = Q.defer();

    defer.reject({
      code: 'invalid.query.parameter',
      type: 'ERROR'
    });

    return defer.promise;
  }

  var ret = {
    type: '/plugins',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'A module that needs access to the API. ' +
        'Administrators can grant access to the information in their group to various modules.',
      type: 'object',
      properties: {
        name: $s.string('A short display name for this plugin.'),
        description: $s.string('A longer description of the functionality this plugin provides.'),
        apikey: $s.guid('An API-key used by this plugin. Not readable, can be set only by superadmins.'),
        permissions: {
          type: 'array',
          description: 'An array of permissions the plugin requires',
          item: {
            type: 'string',
            enum: [
              'create_transactions',
              'create_messages',
              'create_parties',
              'read_messages',
              'read_transactions',
              'read_parties',
              'update_messages',
              'update_parties',
              'delete_messages',
              'delete_parties'
            ]
          }
        },
        configurationschema: $s.string('A JSON schema that expresses the configuration options of this plugin.')
      },
      required: ['name', 'description', 'apikey', 'permissions']
    },
    map: {
      key: {},
      name: {},
      description: {},
      apikey: {
        onread: $m.remove
      },
      permissions: {},
      configurationschema: {}
    },
    validate: [],
    query: {
      apikey: notfound,
      defaultFilter: $q.defaultFilter
    },
    afterupdate: [],
    afterinsert: [],
    afterdelete: []
  };

  common.objectMerge(ret, extra);
  return ret;
};
