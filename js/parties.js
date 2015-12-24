var Q = require('q');
var qfs = require('q-io/fs');
var fs = require('fs');
var common = require('./common.js');
var cl = common.cl;
var s3 = require('s3');
var multer = require('multer');
var multerAutoReap = require('multer-autoreap');
multerAutoReap.options.reapOnError = true;

var MAX_FILESIZE_MB = 10;

// Use disk storage, limit to 5 files of max X Mb each.
// Avoids DoS attacks, or other service unavailability.
// Files are streamed from network -> temporary disk files.
// This requires virtually no memory on the server.
var diskstorage = multer.diskStorage({
  destination: '/tmp/innergerbil'
});

var upload = multer({
  storage: diskstorage,
  limits: {
    fieldNameSize: 256,
    fieldSize: 1024,
    fields: 5,
    fileSize: MAX_FILESIZE_MB * 1024 * 1024,
    files: 5,
    parts: 10,
    headerPairs: 100
  }
});

exports = module.exports = function (sri4node, extra, logdebug) {
  'use strict';
  var $u = sri4node.utils,
    $m = sri4node.mapUtils,
    $s = sri4node.schemaUtils,
    $q = sri4node.queryUtils;

  function debug(x) {
    if (logdebug) {
      cl(x);
    }
  }

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

  function createS3Client() {
    var s3key = process.env.S3_KEY; // eslint-disable-line
    var s3secret = process.env.S3_SECRET; // eslint-disable-line

    if (s3key && s3secret) {
      return s3.createClient({
        maxAsyncS3: 20,     // this is the default
        s3RetryCount: 3,    // this is the default
        s3RetryDelay: 1000, // this is the default
        multipartUploadThreshold: 20971520, // this is the default (20 MB)
        multipartUploadSize: 15728640, // this is the default (15 MB)
        s3Options: {
          accessKeyId: s3key,
          secretAccessKey: s3secret,
          region: 'eu-west-1'
        }
      });
    }

    return null;
  }

  function uploadToS3(s3client, fromFilename, toFilename) {
    var deferred = Q.defer();
    var msg, params;
    var s3bucket = process.env.S3_BUCKET; // eslint-disable-line

    params = {
      localFile: fromFilename,
      s3Params: {
        Bucket: s3bucket,
        Key: toFilename
      }
    };

    var uploader = s3client.uploadFile(params);

    uploader.on('error', function (err) {
      msg = 'All attempts to uploads failed!';
      cl(msg);
      cl(err);
      cl(err.stack);
      deferred.reject(msg);
    });
    uploader.on('end', function () {
      debug('Upload of file [' + fromFilename + '] was successful.');
      deferred.resolve();
    });

    return deferred.promise;
  }

  function downloadFromS3(s3client, response, filename) {
    var s3bucket = process.env.S3_BUCKET; // eslint-disable-line
    var stream, msg;

    var params = {
      Bucket: s3bucket,
      Key: filename
    };
    stream = s3client.downloadStream(params);
    stream.pipe(response);
    stream.on('error', function (err) {
      msg = 'All attempts to download failed!';
      cl(msg);
      cl(err);
      cl(err.stack);
      response.sendStatus(500);
    });
  }

  function handleFileUpload(req, res) {
    var path = process.env.TMP ? process.env.TMP : '/tmp'; // eslint-disable-line
    var s3client = createS3Client();
    var i;
    var fromFilename;
    var toFilename;
    var promises = [];

    debug('handling file upload !');
    debug(req.files);

    if (s3client) {
      for (i = 0; i < req.files.length; i++) {
        fromFilename = req.files[i].path;
        toFilename = req.params.key + '-' + req.params.filename;
        promises.push(uploadToS3(s3client, fromFilename, toFilename));
      }
    } else {
      cl('WARNING : Sending files to temporary storage. SHOULD NOT BE USED IN PRODUCTION !');
      for (i = 0; i < req.files.length; i++) {
        fromFilename = req.files[i].path;
        toFilename = path + '/' + req.params.key + '-' + req.params.filename;
        promises.push(qfs.copy(fromFilename, toFilename));
      }
    }
    Q.all(promises).then(function () {
      // Acknowledge to the client that the files were stored.
      res.sendStatus(201);
    }).catch(function (err) {
      cl('ERROR : Unable to upload all files...');
      cl(err);
      cl(err.stack);
      // Notify the client that a problem occured.
      res.sendStatus(500);
    });
  }

  function handleFileDownload(req, res) {
    var path = process.env.TMP ? process.env.TMP : '/tmp'; // eslint-disable-line
    var s3client = createS3Client();
    var remoteFilename;

    debug('handling file download !');
    if (s3client) {
      remoteFilename = req.params.key + '-' + req.params.filename;
      downloadFromS3(s3client, res, remoteFilename);
    } else {
      cl('WARNING : Reading files from temporary storage. SHOULD NOT BE USED IN PRODUCTION !');
      remoteFilename = path + '/' + req.params.key + '-' + req.params.filename;
      res.setHeader('content-type', 'image/png');
      fs.createReadStream(remoteFilename).pipe(res);
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
        onread: $m.removeifnull
      },
      password: {
        onread: $m.remove
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
    afterdelete: [],
    customroutes: [
      {
        route: '/parties/:key/:filename',
        method: 'PUT',
        middleware: [
          multerAutoReap,
          upload.any()
        ],
        handler: handleFileUpload
      },
      {
        route: '/parties/:key/:filename',
        method: 'GET',
        handler: handleFileDownload
      }
    ]
  };

  common.objectMerge(ret, extra);
  return ret;
};
