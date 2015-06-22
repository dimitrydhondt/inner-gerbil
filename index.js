var express = require('express');
var compress = require('compression');
var app = express();
var pg = require('pg');
var Q = require('q');
var sri4node = require('sri4node');
var $u = sri4node.utils;
var $m = sri4node.mapUtils;
var $s = sri4node.schemaUtils;
var $q = sri4node.queryUtils;

var logentries = require('node-logentries');
var log = logentries.logger({
  token:'ede8cbc7-38c8-4d49-8146-24de8777e2bd'
});

var local = true;
function debug(x) {
    if(!local) {
        log.info("test");
    } else {
        console.log(x);
    }
}

function allParentsOf(value, select, parameter, database, count) {
    var deferred = Q.defer();
    var key = value.split("/")[2];
    
    
    if(count) {
        var q = $u.prepareSQL();
        q.sql(
            "CREATE TEMP TABLE parents ON COMMIT DROP AS ( "+
            "  WITH RECURSIVE search_relations(guid) AS ( " +
            "    VALUES(").param(key).sql(") " +
            "  UNION " +
            "    SELECT r.to FROM relations r, search_relations s where r.\"from\" = s.guid " +  
            "  )"+
            "  SELECT * FROM search_relations" +
            ") ");
        $u.executeSQL(database, q).then(function() {
            select.sql(" AND guid IN (select guid FROM parents) ");
            deferred.resolve();
        }).catch(function(e) {
            debug(e);
            deferred.reject(e);
        });
    } else {
        select.sql(" AND guid IN (select guid FROM parents) ");
        deferred.resolve();
    }

    return deferred.promise;
}

var databaseUrl = process.env.DATABASE_URL;
databaseUrl = 'postgres://gerbil:inner@localhost/postgres';
debug(databaseUrl);
var verbose = true;

// Make sure all requests are sent with compression if the client supports it.
app.use(compress()); 

var mapping = {
    // Log and time HTTP requests ?
    logrequests : true,
    // Log SQL ?
    logsql: verbose,
    // Log debugging information ?
    logdebug: verbose,
    // The URL of the postgres database
    defaultdatabaseurl : databaseUrl,
    // A function to determine the security function.
    identity : function(username, database) {
        debug('identity()');
        var query = $u.prepareSQL("me");
        query.sql('select * from persons where email = ').param(username);
        return $u.executeSQL(database, query).then(function (result) {
            var row = result.rows[0];
            var output = {};
            output.$$meta = {};
            output.$$meta.permalink = '/persons/' + row.guid;
            output.firstname = row.firstname;
            output.lastname = row.lastname;
            output.email = row.email;
            return output;
        });
    },
    resources : [
        {
            type: "/contactdetails",
            public: true,
            secure : [],
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "A contact detail of one of the parties involves in a mutual credit system. It can be an adres, e-mail, website, facebook, etc.. etc..",
                type: "object",
                properties : {
                    type: {
                        type: "string",
                        description: "The type of contactdetail.",
                        enum: ["address","email","facebook","website"]
                    },
                    label: $s.string("A display label for this contact detail."),
                    
                    /* Generic value of the contact detail */
                    value: $s.string("Value for this contact detail. Addresses use different fields."),
                    /* Address fields */
                    street: $s.string("Streetname of the address of residence."),
                    streetnumber: $s.string("Street number of the address of residence."),
                    streetbus: $s.string("Postal box of the address of residence."),
                    zipcode: $s.belgianzipcode("4 digit postal code of the city for the address of residence."),
                    city: $s.string("City for the address of residence."),
                    latitude: $s.numeric("Latitude of the address."),
                    longitude: $s.numeric("Longitude of the address."),
                    
                    public: $s.boolean("Is this contact detail visible to other members of your group (and all it's subgroups ?")
                },
                required: ["type","public"]
            },
            map: {
                type: {},
                label: { onread: $m.removeifnull },
                value: { onread: $m.removeifnull },
                
                street: { onread: $m.removeifnull },
                streetnumber: { onread: $m.removeifnull },
                streetbus: { onread: $m.removeifnull },
                zipcode: { onread: $m.removeifnull },
                city: { onread: $m.removeifnull },
                latitude: { onread: $m.removeifnull },
                longitude: { onread: $m.removeifnull },
                
                public: {}
            },
            validate: [],
            query: {
            },
            afterupdate: [],
            afterinsert: [],
            afterdelete: []
        },
        {
            // Base url, maps 1:1 with a table in postgres 
            // Same name, except the '/' is removed
            type: "/parties",
            // Is this resource public ? 
            // Can it be read / updated / inserted publicly ?
            public: true,
            // Multiple function that check access control 
            // They receive a database object and
            // the security context of the current user.
            secure : [
                //checkAccessOnResource,
                //checkSomeMoreRules
            ],
            // Standard JSON Schema definition. 
            // It uses utility functions, for compactness.
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "A person, organisations, subgroup, group, connectorgroup, etc... participating in a mutual credit system.",
                type: "object",
                properties : {
                    type: {
                        type: "string",
                        description: "The type of party this resource describes.",
                        enum: ["person","organisation","subgroup","group","connector"]
                    },
                    name: $s.string("The name of the party. If it is a person with a christian name you should store [firstname initials/middlename lastname]. As there is no real universal format for naming people, we do not impose one here. (Like making 2 fields, firstname and lastname would do)"),
                    alias: $s.string("Handle the party wants to be known by."),
                    dateofbirth: $s.timestamp("Date of birth for people. Other types of parties don't have a date of birth."),
                    imageurl: $s.string("URL to a profile image for people, a logo for groups, etc..."),
                    login: $s.string("Login for accessing the API. Only people have a login.",3),
                    password: $s.string("Password for accessing the API. Only people have a password. A group is managed by a person that has a relation of type 'administrator' with that group.",3),
                    secondsperunit: $s.numeric("If the party is a group, and it is using the mutual credit system as a time-bank (i.e. agreements with the members exist about using time as currency), then this value expresses the number units per second."),
                    currencyname: $s.string("The name of the currency, as used by a group"),
                    status: {
                        type: "string",
                        description: "The status of this party. Is it active / inactive",
                        enum: ["active","inactive"]
                    }
                },
                required: ["type","name","status"]
            },
            // Functions that validate the incoming resource
            // when a PUT operation is executed.
            validate: [
                //validateAuthorVersusThemes
            ],
            // Supported URL parameters are configured
            // this allows filtering on the list resource.
            query: {
                allParentsOf: allParentsOf
            },
            // All columns in the table that appear in the
            // resource should be declared.
            // Optionally mapping functions can be given.
            map: {
                type: {},
                name: {},
                alias: { onread: $m.removeifnull },
                dateofbirth: { onread: $m.removeifnull },
                imageurl: { onread: $m.removeifnull },
                login: { onread: $m.removeifnull },
                password: { onread: $m.remove },
                secondsperunit: { onread: $m.removeifnull },
                currencyname: { onread: $m.removeifnull },
                status: {}
            },
            // After update, insert or delete
            // you can perform extra actions.
            afterupdate: [],
            afterinsert: [],
            afterdelete: [ 
                //cleanupFunction 
            ]
        },
        {
            type: "/partycontactdetails",
            public: true,
            secure : [],
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "Parties can have contact details associated. These are scoped in the lifetime of the party.",
                type: "object",
                properties : {
                    party: $s.permalink('/parties','The party the contactdetail belongs to.'),
                    contactdetail: $s.permalink('/contactdetails','The contactdetail that is associated with the party.'),
                },
                required: ['party','contactdetail']
            },
            map: {
                party: { references: '/parties' },
                contactdetail: { references: '/contactdetails' },
            },
            validate: [],
            query: {
            },
            afterupdate: [],
            afterinsert: [],
            afterdelete: []
        },
        {
            type: "/relations",
            public: true,
            secure : [],
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "A relationship between two parties that are using a mutual credit system. The type of relationship, together with the types of parties involved determines the semantics of the relationship. For example : when a person is a member of a group, this has a different meaning from a group being member of a connector. Connector groups are used to allow 2 communities of mutual credit users to exchange currency.",
                type: "object",
                properties : {
                    from: { references: "/parties" },
                    to: { references: "/parties" },
                    type: {
                        type: "string",
                        description: "The type of relationship. Currently 'member' and 'adminsitrator' are in use.",
                        enum: ["member","administrator"]
                    },
                    balance: $s.numeric("The balance (currency) of party A in his relationship with party B. Positive means party 'from' has credit, negative means party 'from' has depth."),
                    status: {
                        type: "string",
                        description: "The status of this relation. Is it active / inactive ?",
                        enum: ["active","inactive"]
                    }
                },
                required: ["from","to","type","balance","status"]
            },
            validate: [],
            query: {
                from: $q.filterReferencedType('/parties','from'),
                to: $q.filterReferencedType('/parties','to'),
                type: $q.filterIn('type')
            },
            map: {
                from: {references: '/parties'},
                to: {references: '/parties'},
                type: {},
                balance: {},
                status: {}
            },
            afterupdate: [],
            afterinsert: [],
            afterdelete: []
        },
        {
            type: "/transactions",
            public: true,
            secure : [],
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "A transaction between two parties in a mutual credit system.",
                type: "object",
                properties : {
                    from: $s.permalink('/parties','The party that provides mutual credit.'),
                    to: $s.permalink('/parties','The party that receives mutual credit.'),
                    amount: $s.numeric("The amount of credit. If this is a time-bank it is expressed in seconds."),
                    description: $s.string("A short messages accompanying the transaction.")
                },
                required: ["from","to","amount"]
            },
            map: {
                from: { references: '/parties' },
                to: { references: '/parties' },
                amount: {},
                description: { onread: $m.removeifnull }
            },
            validate: [],
            query: {
                from : $q.filterReferencedType('/parties','from'),
                to : $q.filterReferencedType('/parties','to')
            },
            afterupdate: [],
            afterinsert: [],
            afterdelete: []
        },
        {
            type: "/transactionrelations",
            public: true,
            secure : [],
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "A relation that was affected by a transaction. It's balance was altered by the mentioned transaction. For every transaction in the system these resources provide a record of the details on how the transaction was routed over (possibly multiple) subgroups, groups, connector groups, etc..",
                type: "object",
                properties : {
                    transaction: $s.permalink('/transactions','The transaction this part belongs to.'),
                    relation: $s.permalink('/relations','The relation that was affected by the transaction.'),
                    amount: $s.numeric("The amount of credit. If this is a time-bank it is expressed in seconds.")
                },
                required: ["transaction","relation","amount"]
            },
            map: {
                transaction: { references: '/transactions' },
                relation: { references: '/relations' },
                amount: {}
            },
            validate: [],
            query: {
                transaction : $q.filterReferencedType('/transactions','transaction'),
                relation : $q.filterReferencedType('/relations','relation')
            },
            afterupdate: [],
            afterinsert: [],
            afterdelete: []
        },
        {
            type: "/messages",
            public: true,
            secure : [],
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "A message posted by a person/organisation.",
                type: "object",
                properties : {
                    author: $s.permalink('/parties','The person/organisation that posted this message.'),
                    title: $s.string('Title of the message'),
                    description: $s.string('Message body, in HTML.'),
                    eventdate: $s.timestamp('If the message has tag "evenement", it must supply an event date/time here.'),
                    amount: $s.numeric('The amount of currency requested/offered for a certain activity.'),
                    unit: $s.string('The unit the currency amount applies to. Like : per hour, per item, per person, etc..'),
                    tags: {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "minItems": 2,
                        "uniqueItems": true
                    },
                    photos: {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "minItems": 0,
                        "uniqueItems": false
                    },
                    created: $s.timestamp('When was the message created ?'),
                    modified: $s.timestamp('When was the message last modified ?'),
                    expires: $s.timestamp('When should the message be removed ?')
                },
                required: ["author","description","tags","created","modified"]
            },
            map: {
                author: { references: '/parties' },
                title: { onread: $m.removeifnull },
                description: {},
                eventdate: { onread: $m.removeifnull },
                amount: { onread: $m.removeifnull },
                unit: { onread: $m.removeifnull },
                tags: {},
                photos: { onread: $m.removeifnull },
                created: {},
                modified: {},
                expires: { onread: $m.removeifnull }
            },
            validate: [],
            query: {
            },
            afterupdate: [],
            afterinsert: [],
            afterdelete: []
        },
        {
            type: "/messagecontactdetails",
            public: true,
            secure : [],
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "Messages can have contact details associated. These are scoped in the lifetime of the message.",
                type: "object",
                properties : {
                    message: $s.permalink('/messages','The message the contactdetail belongs to.'),
                    contactdetail: $s.permalink('/contactdetails','The contactdetail that is associated with the message.'),
                },
                required: ['message','contactdetail']
            },
            map: {
                message: { references: '/messages' },
                contactdetail: { references: '/contactdetails' },
            },
            validate: [],
            query: {
            },
            afterupdate: [],
            afterinsert: [],
            afterdelete: []
        },
        {
            type: "/messageparties",
            public: true,
            secure : [],
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "Messages can be posted in more than one group/subgroup. This resource expresses the relationship between a messages and the party where the message is posted.",
                type: "object",
                properties : {
                    message: $s.permalink('/messages','The message that was posted.'),
                    party: $s.permalink('/parties','The party where a message was posted.'),
                },
                required: ['message','party']
            },
            map: {
                message: { references: '/messages' },
                party: { references: '/parties' },
            },
            validate: [],
            query: {
            },
            afterupdate: [],
            afterinsert: [],
            afterdelete: []
        },
        {
            type: "/messagetransactions",
            public: true,
            secure : [],
            schema: {
                $schema: "http://json-schema.org/schema#",
                title: "When a transaction is created, and we know it relates to a certain message, we create one or more /messagetransactions resource.",
                type: "object",
                properties : {
                    message: $s.permalink('/messages','The message.'),
                    transaction: $s.permalink('/transactions','The related transaction.'),
                },
                required: ['message','transaction']
            },
            map: {
                message: { references: '/messages' },
                transaction: { references: '/transactions' },
            },
            validate: [],
            query: {
            },
            afterupdate: [],
            afterinsert: [],
            afterdelete: []
        }
    ]
};

sri4node.configure(app, pg, mapping);
app.set('port', (process.env.PORT || 5000));

var welcome = "<p>Welcome to the <a href='https://github.com/dimitrydhondt/inner-gerbil'>Inner Gerbil API.</a></p>" +
    "<p>You can access the following resources :</p>" +
    "<ul>" +
    "<li>Parties : <a href='/parties'>/parties<a></li>" +
    "<li>Relations : <a href='/relations'>/relations<a></li>" +
    "<li>Contact details for parties : <a href='/contactdetails'>/contactdetails<a></li>" +
    "<li>Transactions : <a href='/transactions'>/transactions<a></li>" +
    "<li>Trace of transactions : <a href='/transactionrelations'>/transactionrelations<a></li>" +
    "</ul>";

    
app.get('/', function(request, response) {
  response.send(welcome);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
