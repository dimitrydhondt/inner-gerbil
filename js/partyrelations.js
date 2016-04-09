var common = require('./common.js');

exports = module.exports = function (sri4node, extra) {
  'use strict';
  var $u = sri4node.utils,
    $m = sri4node.mapUtils,
    $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  function forDescendantsOfParties(value, select) {
    common.descendantsOfParties($u, value, select, 'descendantsOfParties');
    select.sql(
      ' and ("from" in (select key from descendantsOfParties) or "to" in (select key from descendantsOfParties)) '
    );
  }

  function forPartiesReachableFromParties(value, select) {
    common.reachableFromParties($u, value, select, 'partiesReachableFromParties');
    select.sql(
      ' and ("from" in (select key from descendantsOfParties) or "to" in (select key from descendantsOfParties)) '
    );
  }

  function forAncestorsOfParties(value, select) {
    common.ancestorsOfParties($u, value, select, 'ancestorsOfParties');
    select.sql(
      ' and ("from" in (select key from descendantsOfParties) or "to" in (select key from descendantsOfParties)) '
    );
  }

  var ret = {
    type: '/partyrelations',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'A relationship between two parties.' +
        ' The type of relationship, together with the types of parties involved, determines the semantics ' +
        'of the relationship. For example : when a person is a member of a group, this has a different meaning ' +
        'from a group being member of a connector group. Connector groups are used to allow multiple communities ' +
        'to exchange currency and/or messages. Besides being \'a member of\' another party, a party can also be ' +
        '\'an administrator\' of another party. Mind you that these relations are directed - they have a clear ' +
        '"from" and "to" side.',
      type: 'object',
      properties: {
        from: {
          references: '/parties',
          description: 'From what party does the relationship originate ?'
        },
        to: {
          references: '/parties',
          description: 'To what part does the relationship go ?'
        },
        type: {
          type: 'string',
          description: 'The type of relationship. ' +
            'Together with the type of party for "from" and "to", it determines the semantics of this relationship.',
          enum: ['member', 'administrator']
        },
        balance: $s.numeric(
          'The balance (currency) of party A in his relationship with party B. Positive means party "from" has ' +
          'credit, negative means party "from" has debt.'
        ),
        code: $s.string('A code or alias bound to the membership of a person in a group/subgroup. ' +
          'On the person level we also register the full name and alias, but some groups want control ' +
          'over how people are identified in the UI. Groups can select to show the name or alias chosen ' +
          'by people, but they can also choose to show this group controlled code.'
        ),
        upperlimit: $s.numeric('The upper limit (in seconds) for this partyrelation.' +
          'Transactions that would make the balance on this partyrelation ' +
          'exceed this limit will be rejected.'),
        lowerlimit: $s.numeric('The lower limit (in seconds) for this partyrelation.' +
          'Transactions that would make the balance on this partyrelation ' +
          'exceed this limit will be rejected.'),
        status: {
          type: 'string',
          description: 'The status of this relation. Is it active / inactive ?',
          enum: ['active', 'inactive']
        }
      },
      required: ['from', 'to', 'type', 'balance', 'status']
    },
    validate: [],
    query: {
      from: $q.filterReferencedType('/parties', 'from'),
      to: $q.filterReferencedType('/parties', 'to'),
      forPartiesReachableFromParties: forPartiesReachableFromParties,
      forDescendantsOfParties: forDescendantsOfParties,
      forAncestorsOfParties: forAncestorsOfParties,
      defaultFilter: $q.defaultFilter
    },
    queryDocs: {
      from: 'Limit the the resource to relations originating in one of a comma separated list of parties.',
      to: 'Limit the list resource to relations going to one of a comma separated list of parties.',
      forPartiesReachableFromParties: 'Returns contact details that belong to parties that are reachable ' +
        '(potentially via a parent group / subgroup) from a given (comma separated) list of parties. ' +
        'The term "reachable" means the graph of parties will be scanned to all top parents of the ' +
        'given list of parties, and then recursed down to include all parties that are a member ' +
        '(directly or indirectly) of those parent.',
      forDescendantsOfParties: 'Returns contact details that belong to  ' +
        'direct or indirect members of a given (comma separated) list of parties.',
      forAncestorsOfParties: 'Returns contact details that belong to ancestors ' +
        '(direct or indirect parents via an "is member of" relation) of a given ' +
        '(comma separated) list of parties.'
    },
    map: {
      key: {},
      from: {
        references: '/parties'
      },
      to: {
        references: '/parties'
      },
      type: {},
      balance: {
        onupdate: $m.remove,
        oninsert: $m.remove
      },
      code: {
        onread: $m.removeifnull
      },
      upperlimit: {
        onread: $m.removeifnull
      },
      lowerlimit: {
        onread: $m.removeifnull
      },
      status: {}
    },
    afterupdate: [],
    afterinsert: [],
    afterdelete: []
  };

  common.objectMerge(ret, extra);
  return ret;
};
