var Q = require('q');
var common = require('./common.js');
var bcrypt = require('bcrypt');
var cl = common.cl;

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $u = sri4node.utils,
    $m = sri4node.mapUtils,
    $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  function addLinks(database, elements) { /* eslint-disable-line */
    elements.forEach(function (element) {
      if (element.type && element.type !== 'person') {
        element.$$messagesPostedHere = {href: '/messages?postedInParties=' + element.$$meta.permalink};
      }
      if (element.type && element.type === 'person') {
        element.$$messagesPostedBy = {href: '/messages?postedByParties=' + element.$$meta.permalink};
        element.$$transactions = {href: '/transactions?involvingParties=' + element.$$meta.permalink};
      }
      element.$$allParents = {href: '/parties?ancestorsOfParties=' + element.$$meta.permalink};
    });
  }

  function addDirectParent(database, elements) {
    var deferred = Q.defer();

    var keys = [];
    var keyToElement = {};
    elements.forEach(function (element) {
      keys.push(element.key);
      keyToElement[element.key] = element;
    });

    var q = $u.prepareSQL('direct-parent-of-parties');
    q.sql('select "from","to" from "partyrelations" where "type" = \'member\' and "from" in (').array(keys).sql(')');
    cl(q);
    $u.executeSQL(database, q).then(function (result) {
      cl(result.rows);
      result.rows.forEach(function (row) {
        var from = row.from;
        var to = row.to;
        var element = keyToElement[from];
        if (!element.$$directParents) {
          element.$$directParents = [];
        }
        element.$$directParents.push({href: '/parties/' + to});
      });
      deferred.resolve();
    });

    return deferred.promise;
  }

  function reachableFromParties(value, select) {
    common.reachableFromParties($u, value, select, 'childrenof');
    select.sql(' and key in (select key from childrenof) ');
  }

  function descendantsOfParties(value, select) {
    common.descendantsOfParties($u, value, select, 'descendantsOfParties');
    select.sql(' and key in (select key from descendantsOfParties) ');
  }

  function ancestorsOfParties(value, select) {
    common.ancestorsOfParties($u, value, select, 'ancestorsOfParties');
    select.sql(' and key in (SELECT key FROM ancestorsOfParties) ');
  }

  function inLatLong(value, select) {
    common.filterLatLong($u, value, select, 'parties', 'latlongcontactdetails');
    select.sql(' and key in (select key from latlongcontactdetails) ');
  }
  
  function conditionLogin(key,e){
    if (!e[key] || e.type !== 'person') {
      $m.remove(key, e);
    }
  }

  function conditionPassword(key, e) {
    var salt;
    if (e[key] && e.type === 'person') {
      salt = bcrypt.genSaltSync(10);
      e[key] = bcrypt.hashSync(e[key], salt);
    } else {
      $m.remove(key, e);
    }
  }

  var ret = {
    // Base url, maps 1:1 with a table in postgres
    // Same name, except the '/' is removed
    type: '/parties',
    // Is this resource public ?
    // Can it be read / updated / inserted publicly ?
    public: false,
    // Multiple function that check access control
    // They receive a database object and
    // the security context of the current user.
    secure: [
      //checkAccessOnResource,
      //checkSomeMoreRules
    ],
    // Standard JSON Schema definition.
    // It uses utility functions, for compactness.
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'A person, organisations, subgroup, group, connector group, etc... ' +
        'participating in a mutual credit system, time bank or knowledge bank.',
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'The type of party this resource describes.',
          enum: ['person', 'organisation', 'subgroup', 'group', 'connector']
        },
        name: $s.string(
          'The name of the party. If it is a person with a christian name you should store ' +
          '[firstname initials/middlename lastname]. As there is no real universal format for naming people, ' +
          'we do not impose one here. (Like making 2 fields, firstname and lastname would do)'
        ),
        alias: $s.string('Handle the party wants to be known by.'),
        dateofbirth: $s.timestamp('Date of birth for people. Other types of parties don\'t have a date of birth.'),
        imageurl: $s.string('URL to a profile image for people, a logo for groups, etc...'),
        login: $s.string('Login for accessing the API. Only people have a login.', 3),
        password: $s.string(
          'Password for accessing the API. Only people have a password. ' +
          'Can only be PUT, and is never returned on GET.',
          3),
        secondsperunit: $s.numeric(
          'If the party is a group that operates a time bank (i.e. agreements with ' +
          'the members exist about using time as currency), then this value expresses the number units per second.'
        ),
        currencyname: $s.string('The name of the currency, as used by a mutual credit group'),
        status: {
          type: 'string',
          description: 'The status of this party.',
          enum: ['active', 'inactive']
        }
      },
      required: ['type', 'name', 'status']
    },
    // Functions that validate the incoming resource
    // when a PUT operation is executed.
    validate: [
      //validateAuthorVersusThemes
    ],
    // Supported URL parameters are configured
    // this allows filtering on the list resource.
    query: {
      ancestorsOfParties: ancestorsOfParties,
      reachableFromParties: reachableFromParties,
      descendantsOfParties: descendantsOfParties,
      forMessages: common.filterRelatedManyToMany($u, 'messageparties', 'party', 'message'),
      inLatLong: inLatLong,
      defaultFilter: $q.defaultFilter
    },
    queryDocs: {
      ancestorsOfParties: 'Only retrieve parties that are direct, or indirect parent ' +
        '(via an "is member of" relation) of given parties.',
      reachableFromParties: 'Only retrieve parties that are reachable from a (comma-separated) ' +
        'list of parties. By reachable we mean parties that are found by first finding all ' +
        '(direct or indirect) parents (via an "is member of" relation) of a list of parties. ' +
        'And then by finding, from those top level parents, all (direct or indirect) children.',
      descendantsOfParties: 'Only retrieve direct and indirect members of the given parties.',
      forMessages: 'Only retrieve parties where the given messages were posted.',
      inLatLong: 'Retrieve parties in a geographic box. The box must be expressed in terms of a ' +
        'minimum and maximum latitude and longitude. The boundaries MUST be expressed as degrees with ' +
        'exactly one decimal digit. ' +
        'They must be specified in the format minLat,maxLat,minLong,maxLong (comma separated).' +
        '<p>Example : <code><a href="/parties?inLatLong=50.9,51.0,4.1,4.2">' +
        'GET /parties?inLatLong=50.9,51.0,4.1,4.2</a></code></p>'
    },
    // All columns in the table that appear in the
    // resource should be declared.
    // Optionally mapping functions can be given.
    map: {
      key: {},
      type: {},
      name: {},
      alias: {
        onread: $m.removeifnull
      },
      dateofbirth: {
        onread: $m.removeifnull
      },
      imageurl: {
        onread: $m.removeifnull
      },
      login: {
        onread: $m.removeifnull,
        oninsert: conditionLogin,
        onwrite: conditionLogin
      },
      password: {
        onread: $m.remove,
        oninsert: conditionPassword,
        onwrite: conditionPassword
      },
      secondsperunit: {
        onread: $m.removeifnull
      },
      currencyname: {
        onread: $m.removeifnull
      },
      status: {}
    },
    // After update, insert or delete
    // you can perform extra actions.
    afterread: [
      addLinks, addDirectParent
    ],
    afterupdate: [],
    afterinsert: [],
    afterdelete: []
  };

  common.objectMerge(ret, extra);
  return ret;
};
