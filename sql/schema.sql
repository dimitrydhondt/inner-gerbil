CREATE SCHEMA innergerbil;

SET search_path TO innergerbil;

-- Contactdetails
CREATE TABLE "contactdetails" (
    "key" uuid unique not null,
    
    "type" text not null,   
    "label" text,

    "street" text,
    "streetnumber" text,
    "streetbus" text,
    "zipcode" text,
    "city" text,
    "latitude" double precision,
    "longitude" double precision,

    "value" text,
    
    "public" boolean not null,
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp
);

-- Parties and relations
CREATE TABLE "parties" (
    "key" uuid unique not null,
    "type" text not null,
    "name" text not null,
    "alias" text,
    "dateofbirth" timestamp with time zone,
    "imageurl" text,
    "login" text,
    "password" text,
    "secondsperunit" integer,
    "currencyname" text,
    "status" text not null, /* active, inactive, ... */
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp
);

CREATE TABLE "partycontactdetails" (
    "key" uuid unique not null,
    "party" uuid references "parties"(key) not null,
    "contactdetail" uuid references "contactdetails"(key) not null,

    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp

);
CREATE INDEX "partycontactdetails-party" ON "partycontactdetails"("party");
CREATE INDEX "partycontactdetails-contactdetail" ON "partycontactdetails"("contactdetail");

-- Relationships between parties.
CREATE TABLE "partyrelations" (
    "key" uuid unique not null,
    "from" uuid references "parties"(key) not null,
    "to" uuid references "parties"(key) not null,
    "type" text not null,
    "balance" integer default(0),
    "code" text,
    "upperlimit" integer default(180000), /* 50 hours, in seconds */
    "lowerlimit" integer default(-180000), /* 50 hours, in seconds */
    "status" text not null, /* active/inactive */

    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp
);
CREATE INDEX "partyrelations-from" ON "partyrelations"("from");
CREATE INDEX "partyrelations-to" ON "partyrelations"("to");

-- Transactions
CREATE TABLE "transactions" (
    "key" uuid unique not null,
    "from" uuid references "parties"(key) not null,
    "to" uuid references "parties"(key) not null,
    "amount" integer not null,
    "description" text,
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp  
);
CREATE INDEX "transactions-from" ON "transactions"("from");
CREATE INDEX "transactions-to" ON "transactions"("to");

CREATE TABLE "transactionrelations" (
    "key" uuid unique not null,
    "transaction" uuid references "transactions"(key) not null,
    "partyrelation" uuid references "partyrelations"(key) not null,
    "amount" integer not null,
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp
);
CREATE INDEX "transactionrelations-transaction" ON "transactionrelations"("transaction");
CREATE INDEX "transactionrelations-relation" ON "transactionrelations"("partyrelation");

-- Messages
CREATE TABLE "messages" (
    "key" uuid unique not null,
    "author" uuid references "parties"(key) not null,
    "title" text,    -- not required for responses.
    "description" text,
    "eventdate" timestamp with time zone,
    "amount" integer,
    "unit" text,
    "tags" text array,
    "photos" text array,
    "created" timestamp with time zone not null default (now() at time zone 'utc'),
    "modified" timestamp with time zone not null default (now() at time zone 'utc'),
    "expires" timestamp with time zone, -- not required for responses.
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp  
);
CREATE INDEX "messages-author" ON "messages"("author");

-- To support postgreSQL full text search :
-- ALTER TABLE messages ADD COLUMN search tsvector;
-- CREATE TRIGGER searchupdate BEFORE INSERT OR UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(search, 'pg_catalog.dutch', title, description);
-- CREATE INDEX searchindex ON messages USING gin(search);
-- Example search : SELECT * FROM MESSAGES WHERE search @@ to_tsquery('dutch','schakel:*');

CREATE TABLE "messagecontactdetails" (
    "key" uuid unique not null,
    "message" uuid references "messages"(key) not null,
    "contactdetail" uuid references "contactdetails"(key) not null,
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp  
);
CREATE INDEX "messagecontactdetails-message" ON "messagecontactdetails"("message");
CREATE INDEX "messagecontactdetails-contactdetail" ON "messagecontactdetails"("contactdetail");

CREATE TABLE "messageparties" (
    "key" uuid unique not null,
    "message" uuid references "messages"(key) not null,
    "party" uuid references "parties"(key) not null,
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp  
);
CREATE INDEX "messageparties-message" ON "messageparties"("message");
CREATE INDEX "messageparties-party" ON "messageparties"("party");

CREATE TABLE "messagetransactions" (
    "key" uuid unique not null,
    "message" uuid references "messages"(key),
    "transaction" uuid references "transactions"(key) not null,
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp  
);
CREATE INDEX "messagetransactions-party" ON "messagetransactions"("message");
CREATE INDEX "messagetransactions-transaction" ON "messagetransactions"("transaction");

CREATE TABLE "messagerelations" (
    "key" uuid unique not null,
    "from" uuid references "messages"(key) not null,
    "to" uuid references "messages"(key) not null,
    "type" text not null,
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp
);
CREATE INDEX "messagerelations-from" ON "messagerelations"("from");
CREATE INDEX "messagerelations-to" ON "messagerelations"("to");

-- Plugin tables
CREATE TABLE "plugins" (
    "key" uuid unique not null,
    "name" text not null,
    "description" text not null,
    "apikey" uuid unique not null,
    "permissions" text[] not null,
    "configurationschema" text,
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp  
);

CREATE TABLE "pluginauthorisations" (
    "key" uuid unique not null,
    "plugin" uuid references "plugins"(key) not null,
    "party" uuid references "parties"(key) not null,

    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp
);
CREATE INDEX "pluginauthorisations-plugin" ON "pluginauthorisations"("plugin");
CREATE INDEX "pluginauthorisations-party" ON "pluginauthorisations"("party");

CREATE TABLE "plugindata" (
    "key" uuid unique not null,
    "plugin" uuid references "plugins"(key) not null,
    "resource" text not null,
    "data" jsonb not null,
  
    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp  
);
CREATE INDEX "plugindata-plugin" ON "plugindata"("plugin");
CREATE INDEX "plugindata-resource" ON "plugindata"("resource");
CREATE INDEX "plugindata-plugin-resource" ON "plugindata"("plugin","resource");

CREATE TABLE "pluginconfigurations" (
    "key" uuid unique not null,
    "plugin" uuid references "plugins"(key) not null,
    "party" uuid references "parties"(key) not null,
    "data" jsonb not null,

    "$$meta.deleted" boolean not null default false,
    "$$meta.modified" timestamp with time zone not null default current_timestamp,
    "$$meta.created" timestamp with time zone not null default current_timestamp
);
CREATE INDEX "pluginconfigurations-plugin" ON "pluginconfigurations"("plugin");
CREATE INDEX "pluginconfigurations-party" ON "pluginconfigurations"("party");
CREATE INDEX "pluginconfigurations-plugin-party" ON "pluginconfigurations"("plugin","party");