var common = require('./common.js');
var cl = common.cl;
var Q = require('q');
var uuid = require('uuid');

exports = module.exports = function (sri4node, extra, logverbose) {
  'use strict';
  var $m = sri4node.mapUtils,
    $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils,
    $u = sri4node.utils;

  function debug(x) {
    if (logverbose) {
      console.log(x); // eslint-disable-line
    }
  }

  function involvingParties(value, select) {
    var permalinks = value.split(',');
    var keys = [];

    permalinks.forEach(function (permalink) {
      var key = permalink.split('/')[2];
      keys.push(key);
    });

    select.sql(' and ("from" in (').array(keys).sql(') or "to" in (').array(keys).sql(')) ');
  }

  function involvingDescendantsOfParties(value, select) {
    common.descendantsOfParties($u, value, select, 'descendantsOfParties');
    select.sql(' and ("from" in (select key from descendantsOfParties)' +
               ' or "to" in (select key from descendantsOfParties)) ');
  }

  function involvingAncestorsOfParties(value, select) {
    common.ancestorsOfParties($u, value, select, 'ancestorsOfParties');
    select.sql(' and ("from" in (select key from ancestorsOfParties)' +
               ' or "to" in (select key from ancestorsOfParties)) ');
  }

  function fromDescendantsOfParties(value, select) {
    common.descendantsOfParties($u, value, select, 'descendantsOfParties');
    select.sql(' and "from" in (select key from descendantsOfParties) ');
  }

  function toDescendantsOfParties(value, select) {
    common.descendantsOfParties($u, value, select, 'descendantsOfParties');
    select.sql(' and "to" in (select key from descendantsOfParties) ');
  }

  function rejectOperation() {
    throw new Error('Invalid PUT.');
  }

  function findParentPartyRelations(database, partyKeys, partyRelations) {
    var q = $u.prepareSQL();
    var nonrecursive = $u.prepareSQL();
    var recursive = $u.prepareSQL();
    var i;
    var msg;

    nonrecursive.sql('select "key","from","to","balance" from partyrelations ' +
    'where "from" in (').values(partyKeys).sql(')');
    recursive.sql('select pr."key",pr."from",pr."to",pr."balance" from partyrelations pr, ' +
                  'parentpartyrelations ppr where pr."from" = ppr."to"');
    q.with(nonrecursive, 'UNION', recursive, 'parentpartyrelations');
    q.sql('select "key","from","to","balance" from parentpartyrelations');
    debug(q);
    return $u.executeSQL(database, q).then(function (result) {
      for (i = 0; i < result.rows.length; i++) {
        partyRelations.push(result.rows[i]);
      }
      debug('Found /partyrelations : ');
      debug(partyRelations);
    }).catch(function (error) {
      msg = 'Unable to query parents for parties ' + partyKeys;
      cl(msg);
      cl(error);
      throw new Error(msg);
    });
  }

  // Create a map out of a list of /partyrelations
  // Every key in the map contains an *array* of
  // /partyrelations that start 'from' the key.
  function mapPartyRelations(partyRelations) {
    var ret = {};
    var i, current, from;

    for (i = 0; i < partyRelations.length; i++) {
      current = partyRelations[i];
      from = current.from;
      if (!ret[from]) {
        ret[from] = [];
      }
      ret[from].push(current);
    }

    return ret;
  }

  function findPathsInParentPartyRelations(parentPartyRelations, keys) {
    var i, j, partyRelations, partyRelation;
    var path, last, added, cloned;

    // paths is an array of arrays. The lowest level array contains
    // a list of /partyrelations.
    var paths = [];

    // Map that allows easy retrieval of all /partyrelations
    // that start with 'from'. Every key in the map has an array of
    // /partyrelations that have the same 'from' party.
    var fromToPartyRelations = mapPartyRelations(parentPartyRelations);

    // First determine all possible /partyrelations that start from
    // parties with one of 'keys'.
    for (i = 0; i < keys.length; i++) {
      // Array with all /partyrelations that start from the current party
      partyRelations = fromToPartyRelations[keys[i]];
      for (j = 0; j < partyRelations.length; j++) {
        partyRelation = partyRelations[j];
        paths.push([partyRelation]);
      }
    }

    // Now that we have all paths that start from the root parties,
    // we have to loop until no more new partyrelations are found that
    // extends one of the existing paths.
    do {
      added = false;
      for (i = 0; i < paths.length; i++) {
        path = paths[i];
        last = path[path.length - 1];
        partyRelations = fromToPartyRelations[last.to];
        if (partyRelations && partyRelations.length) {
          for (j = 0; j < partyRelations.length; j++) {
            added = true;
            partyRelation = partyRelations[j];
            if (j === 0) {
              path.push(partyRelation);
            } else {
              cloned = path.slice(0);
              cloned.push(partyRelation);
              paths.push(cloned);
            }
          }
        }
      }
    } while (added);

    return paths;
  }

  // Convert a double array of /partyrelations into a human readable
  // output string.
  function pathsAsString(paths) {
    var i, j, path, partyRelation;
    var ret = '';

    for (i = 0; i < paths.length; i++) {
      path = paths[i];
      for (j = 0; j < path.length; j++) {
        partyRelation = path[j];
        if (j > 0) {
          ret += ' -> ';
        }
        ret += partyRelation.from;
        if (j === path.length - 1) {
          ret += ' -> ' + partyRelation.to;
        }
      }
      ret += '\n';
    }

    return ret;
  }

  // Determine if 2 paths have a common party.
  function pathsHaveCommonParty(pathA, pathB) {
    var i, j, partyA, partyB;

    for (i = 0; i < pathA.length; i++) {
      for (j = 0; j < pathB.length; j++) {
        partyA = pathA[i].to;
        partyB = pathB[j].to;
        if (partyA === partyB) {
          // pathA and pathB have a common party.
          return true;
        }
      }
    }

    return false;
  }

  function sliceUntilFirstCommonAncestor(fromPath, toPath) {
    var k, l;

    for (k = 0; k < fromPath.length; k++) {
      for (l = 0; l < toPath.length; l++) {
        if (fromPath[k].to === toPath[l].to) {
          // First common ancestor found
          return {
            from: fromPath.slice(0, k + 1),
            to: toPath.slice(0, l + 1)
          };
        }
      }
    }

    throw new Error('Unable to find first common ancestor !!!');
  }

  // Returns an array of objects. Each object has from -> a path + to -> a path.
  function findPossibleRoutesForTransaction(paths, transaction) {
    var i, j, fromPath, toPath;
    var tranFromSplit, tranToSplit, tranFromKey, tranToKey;
    var ret = [];

    tranFromSplit = transaction.from.href.split('/');
    tranToSplit = transaction.to.href.split('/');
    tranFromKey = tranFromSplit[tranFromSplit.length - 1];
    tranToKey = tranToSplit[tranToSplit.length - 1];

    for (i = 0; i < paths.length; i++) {
      for (j = 0; j < paths.length; j++) {
        if (i !== j) {
          fromPath = paths[i];
          toPath = paths[j];
          if (fromPath[0].from === tranFromKey && toPath[0].from === tranToKey) {
            if (pathsHaveCommonParty(fromPath, toPath)) {
              // Found a path from the initiating party
              // AND found a path from the benefactor party
              //
              // Now cut this path to the first common ancestor.
              ret.push(sliceUntilFirstCommonAncestor(fromPath, toPath));
            }
          }
        }
      }
    }

    return ret;
  }

  // Returns an object of form :
  // { from : [ partyrelation1, partyrelation2 ], to: [partyrelation3] }
  // All /partyrelations in the 'from' result their balance should be REDUCED with the amount of the transaction.
  // All /partyrelations in the 'to' result their balance should be INCREASED with the amount of the transaction.
  // Relevant /transactionrelations should be created to log the route of this transaction in the database.
  function findRouteForTransaction(paths, transaction) {
    var possibleRoutes = findPossibleRoutesForTransaction(paths, transaction);
    var i, route, length, minimumLength = -1, currentRoute;

    for (i = 0; i < possibleRoutes.length; i++) {
      route = possibleRoutes[i];
      length = route.from.length + route.to.length;
      if (minimumLength === -1 || length < minimumLength) {
        currentRoute = route;
      }
    }

    return currentRoute;
  }

  function updatePartyRelationsForRoute(database, transaction, route, promises) {
    var i, update;

    for (i = 0; i < route.from.length; i++) {
      update = $u.prepareSQL('update-party-relation-on-transaction-from');
      update.sql('update partyrelations set balance = balance - ').param(transaction.amount)
        .sql(' where key = ').param(route.from[i].key);
      debug('UPDATING balance on /partyrelation :');
      debug(update);
      promises.push($u.executeSQL(database, update));
    }

    for (i = 0; i < route.to.length; i++) {
      update = $u.prepareSQL('update-party-relation-on-transaction-to');
      update.sql('update partyrelations set balance = balance + ').param(transaction.amount)
        .sql(' where key = ').param(route.to[i].key);
      debug('UPDATING balance on /partyrelation :');
      debug(update);
      promises.push($u.executeSQL(database, update));
    }
  }

  function insertTransactionRelationsForRoute(database, path, transaction, route, promises) {
    var i, insert, tr, pathSplit, transactionKey;

    pathSplit = path.split('/');
    transactionKey = pathSplit[pathSplit.length - 1];

    for (i = 0; i < route.from.length; i++) {
      tr = {
        key: uuid.v4(),
        transaction: transactionKey,
        partyrelation: route.from[i].key,
        amount: -transaction.amount
      };
      insert = $u.prepareSQL('insert-transactionrelations-on-transaction');
      insert.sql('insert into transactionrelations (').keys(tr).sql(') values (')
        .values(tr).sql(')');
      debug('CREATING /transactionrelation :');
      debug(insert);
      promises.push($u.executeSQL(database, insert));
    }

    for (i = 0; i < route.to.length; i++) {
      tr = {
        key: uuid.v4(),
        transaction: transactionKey,
        partyrelation: route.to[i].key,
        amount: transaction.amount
      };
      insert = $u.prepareSQL('insert-transactionrelations-on-transaction');
      insert.sql('insert into transactionrelations (').keys(tr).sql(') values (')
        .values(tr).sql(')');
      debug('CREATING /transactionrelation :');
      debug(insert);
      promises.push($u.executeSQL(database, insert));
    }
  }

  function onInsertTransaction(database, elems) {
    var elements;
    var keys = [];
    var fromKey, toKey, parts;
    var parentPartyRelations = [];
    var i;
    var msg;
    var paths;
    var transaction, path;
    var route;
    var promises = [];

    // For backwards compatibility.
    if (elems && !elems.length && elems.path && elems.body) {
      // elems is a single item, convert into array
      elements = [elems];
    } else if (elems && elems.length) {
      elements = elems;
    } else {
      throw new Error('Unknown format for elems.');
    }

    // Find all unique keys of parties in any of the transactions in this batch.
    for (i = 0; i < elements.length; i++) {
      parts = elements[0].body.from.href.split('/');
      fromKey = parts[parts.length - 1];
      parts = elements[0].body.to.href.split('/');
      toKey = parts[parts.length - 1];

      if (keys.indexOf(fromKey) === -1) {
        keys.push(fromKey);
      }
      if (keys.indexOf(toKey) === -1) {
        keys.push(toKey);
      }
    }

    // Find all parents, recursively of the parties involved in the transactions
    // in this batch.
    return findParentPartyRelations(database, keys, parentPartyRelations).then(function () {
      // Determine, from the WITH RECURSIVE query result, all individual possible
      // paths from the keys of the parties involved in any of the transactions
      // in this batch.
      paths = findPathsInParentPartyRelations(parentPartyRelations, keys);
      debug('FOUND PATH(S) : ');
      debug(pathsAsString(paths));

      // For each transaction determine the route + update balances + create /transactionrelations
      for (i = 0; i < elements.length; i++) {
        transaction = elements[i].body;
        path = elements[i].path;
        route = findRouteForTransaction(paths, transaction);
        debug('DETERMINED ROUTE for transaction : ');
        debug(route);
        // Now generate the necessary update statements on the balances of the partyrelations
        updatePartyRelationsForRoute(database, transaction, route, promises);
        // And insert the necessary /transactionrelations to log this route.
        insertTransactionRelationsForRoute(database, path, transaction, route, promises);
      }

      return Q.allSettled(promises);
    }).then(function (results) {
      for (i = 0; i < results.length; i++) {
        if (results[i].state === 'rejected') {
          msg = 'Unable to execute all UPDATE/INSERT statements to route transaction.';
          cl(msg);
          cl(results[i]);
          throw new Error(msg);
        }
      }

      return true;
    }).catch(function (error) {
      msg = 'Unable to find parent of parties involved in (batch of) transactions !';
      cl(msg);
      cl(error);
      cl(error.stack);
      throw new Error(msg);
    });
  }

  var config = {
    type: '/transactions',
    public: false,
    secure: [],
    schema: {
      $schema: 'http://json-schema.org/schema#',
      title: 'A transaction between two parties in a mutual credit system.',
      type: 'object',
      properties: {
        from: $s.permalink('/parties', 'The party that provides mutual credit.'),
        to: $s.permalink('/parties', 'The party that receives mutual credit.'),
        amount: $s.numeric('The amount of credit. If this is a time-bank it is expressed in seconds.'),
        description: $s.string('A short messages accompanying the transaction.')
      },
      required: ['from', 'to', 'amount']
    },
    map: {
      key: {},
      from: {
        references: '/parties'
      },
      to: {
        references: '/parties'
      },
      amount: {},
      description: {
        onread: $m.removeifnull
      }
    },
    validate: [],
    query: {
      from: $q.filterReferencedType('/parties', 'from'),
      to: $q.filterReferencedType('/parties', 'to'),
      involvingParties: involvingParties,

      forMessages: common.filterRelatedManyToMany($u, 'messagetransactions', 'transaction', 'message'),

      involvingAncestorsOfParties: involvingAncestorsOfParties,
      involvingDescendantsOfParties: involvingDescendantsOfParties,

      fromDescendantsOfParties: fromDescendantsOfParties,
      toDescendantsOfParties: toDescendantsOfParties,
      defaultFilter: $q.defaultFilter
    },
    queryDocs: {
      from: 'Returns transactions where the originator is one of a list of ' +
        '(comma separated) parties.',
      to: 'Returns transactions benefitting one of a list of ' +
        '(comma separated) parties.',
      involvingParties: 'Returns transactions where on of a (comma separated) ' +
        'list of parties is involved (either as originator or as beneficiary).',

      forMessages: 'Returns transactions that are associated with one of a list ' +
        'of (comma separated) messages.',

      involvingAncestorsOfParties: 'Returns transactions involving any ' +
        'direct or indirect parents (via an "is member of" relation) of a ' +
        'comma separated list of parties.',
      involvingDescendantsOfParties: 'Returns transactions involving any ' +
        'direct or indirect members of a comma separated list of parties.',

      fromDescendantsOfParties: 'Returns transactions originating from any ' +
        'direct or indirect member of a comma separated list of parties.',
      toDescendantsOfParties: 'Returns transaction benefitting any ' +
        'direct or indirect member of a comma separated list of parties.'
    },
    afterread: [
      common.addRelatedManyToMany($u, 'messagetransactions', 'transaction', 'message',
                                  '/messages', '$$messages')
    ],
    afterupdate: [
      rejectOperation
    ],
    afterinsert: [
      onInsertTransaction
    ],
    afterdelete: [
      rejectOperation
    ]
  };

  common.objectMerge(config, extra);
  return config;
};
