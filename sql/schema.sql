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
    
    "public" boolean not null
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
    "status" text not null /* active, inactive, ... */
);

CREATE TABLE "partycontactdetails" (
    "key" uuid unique not null,
    "party" uuid references "parties"(key) not null,
    "contactdetail" uuid references "contactdetails"(key) not null
);
CREATE INDEX "partycontactdetails-party" ON "partycontactdetails"("party");
CREATE INDEX "partycontactdetails-contactdetail" ON "partycontactdetails"("contactdetail");

-- Relationships between parties.
CREATE TABLE "partyrelations" (
    "key" uuid unique not null,
    "from" uuid references "parties"(key) not null,
    "to" uuid references "parties"(key) not null,
    "type" text not null,
    "balance" bigint,
    "status" text not null /* active/inactive */
);
CREATE INDEX "partyrelations-from" ON "partyrelations"("from");
CREATE INDEX "partyrelations-to" ON "partyrelations"("to");

-- Transactions
CREATE TABLE "transactions" (
    "key" uuid unique not null,
    "from" uuid references "parties"(key) not null,
    "to" uuid references "parties"(key) not null,
    "amount" bigint not null,
    "description" text
);
CREATE INDEX "transactions-from" ON "transactions"("from");
CREATE INDEX "transactions-to" ON "transactions"("to");

CREATE TABLE "transactionrelations" (
    "key" uuid unique not null,
    "transaction" uuid references "transactions"(key) not null,
    "partyrelation" uuid references "partyrelations"(key) not null,
    "amount" bigint not null
);
CREATE INDEX "transactionrelations-transaction" ON "transactionrelations"("transaction");
CREATE INDEX "transactionrelations-relation" ON "transactionrelations"("partyrelation");

-- Messages
CREATE TABLE "messages" (
    "key" uuid unique not null,
    "author" uuid references "parties"(key) not null,
    "title" text not null,    
    "description" text,
    "eventdate" timestamp with time zone,
    "amount" integer,
    "unit" text,
    "tags" text array,
    "photos" text array,
    "created" timestamp with time zone not null default (now() at time zone 'utc'),
    "modified" timestamp with time zone not null default (now() at time zone 'utc'),
    "expires" timestamp with time zone not null
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
    "contactdetail" uuid references "contactdetails"(key) not null
);
CREATE INDEX "messagecontactdetails-message" ON "messagecontactdetails"("message");
CREATE INDEX "messagecontactdetails-contactdetail" ON "messagecontactdetails"("contactdetail");

CREATE TABLE "messageparties" (
    "key" uuid unique not null,
    "message" uuid references "messages"(key) not null,
    "party" uuid references "parties"(key) not null
);
CREATE INDEX "messageparties-message" ON "messageparties"("message");
CREATE INDEX "messageparties-party" ON "messageparties"("party");

CREATE TABLE "messagetransactions" (
    "key" uuid unique not null,
    "message" uuid references "messages"(key),
    "transaction" uuid references "transactions"(key) not null
);
CREATE INDEX "messagetransactions-party" ON "messagetransactions"("message");
CREATE INDEX "messagetransactions-transaction" ON "messagetransactions"("transaction");
