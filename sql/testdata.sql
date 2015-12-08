SET search_path TO innergerbil;

-- Parties
-- key, type, name, alias, dateofbirth, imageurl, login, password, secondsperunit, currencyname, status
-- LETS Groups

INSERT INTO "parties" VALUES ('8bf649b4-c50a-4ee9-9b02-877aa0a71849','group','LETS Regio Dendermonde',null,null,null,null,null,180,'duim','active');
INSERT INTO "parties" VALUES ('aca5e15d-9f4c-4c79-b906-f7e868b3abc5','subgroup','LETS Lebbeke',null,null,null,null,null,180,'duim','active');
INSERT INTO "parties" VALUES ('0a98e68d-1fb9-4a31-a4e2-9289ee2dd301','group','LETS Hamme',null,null,null,null,null,180,'zaadje','active');

-- People
-- Anna De Vlaming is member of LETS Lebbeke
INSERT INTO "parties" VALUES ('5df52f9f-e51f-4942-a810-1496c51e64db','person','Anna De Vlaming',null,'1980-10-11 00:00:00',null,'annadv','$2a$10$opK7EbDDgHsyClvsh5lun.VISomjnv/RXifFpWAlasVL7pxPnlY4y',null,null,'active');
-- Steven Butink is member of LETS Lebbeke
INSERT INTO "parties" VALUES ('fa17e7f5-ade9-49d4-abf3-dc3722711504','person','Steven Buytink',null,'1979-04-01 00:00:00',null,'stevenb','$2a$10$opK7EbDDgHsyClvsh5lun.VISomjnv/RXifFpWAlasVL7pxPnlY4y',null,null,'active');
-- Rudi Rudolf is member of LETS Dendermonde
INSERT INTO "parties" VALUES ('eb6e3ad7-066f-4357-a582-dfb31e173606','person','Rudi Rudolf',null,'1968-10-23 00:00:00',null,'rudir','$2a$10$opK7EbDDgHsyClvsh5lun.VISomjnv/RXifFpWAlasVL7pxPnlY4y',null,null,'active');
-- Eddy is not a member of any group/subgroup/...
INSERT INTO "parties" VALUES ('437d9b64-a3b4-467c-9abe-e9410332c1e5','person','Eddy Merckx',null,'1963-01-03',null,'eddym','$2a$10$opK7EbDDgHsyClvsh5lun.VISomjnv/RXifFpWAlasVL7pxPnlY4y',null,null,'active');
-- Leen De Baere of LETS Hamme
INSERT INTO "parties" VALUES ('abcb3c6e-721e-4f7c-ae4a-935e1980f15e','person','Leen De Baere',null,'1980-04-01',null,'leendb','$2a$10$opK7EbDDgHsyClvsh5lun.VISomjnv/RXifFpWAlasVL7pxPnlY4y',null,null,'active');
-- Emmanuella of LETS Hamme
INSERT INTO "parties" VALUES ('508f9ec9-df73-4a55-ad42-32839abd1760','person','Emmanuella',null,'1982-05-01',null,'emmanuella','$2a$10$opK7EbDDgHsyClvsh5lun.VISomjnv/RXifFpWAlasVL7pxPnlY4y',null,null,'active');

-- partyrelations -- key, from, to, type, balance, status
-- LETS Lebbeke is a member of LETS Dendermonde
INSERT INTO "partyrelations" VALUES('cddffa35-6a2f-46c4-aa39-5b9040b4f429','aca5e15d-9f4c-4c79-b906-f7e868b3abc5','8bf649b4-c50a-4ee9-9b02-877aa0a71849','member',0,null,'active');
-- Rudi Rudolf is a member of LETS Dendermonde
INSERT INTO "partyrelations" VALUES('c67139c2-779f-4d5c-9183-bbb9252574de','eb6e3ad7-066f-4357-a582-dfb31e173606','8bf649b4-c50a-4ee9-9b02-877aa0a71849','member',0,null,'active');
-- Anna in LETS Lebbeke
INSERT INTO "partyrelations" VALUES('419e6446-9b3e-4e7d-9381-0c38af0b316a','5df52f9f-e51f-4942-a810-1496c51e64db','aca5e15d-9f4c-4c79-b906-f7e868b3abc5','member',-20,null,'active');
-- Steven in LETS Lebbeke
INSERT INTO "partyrelations" VALUES('db41c12a-a521-443a-97f1-f0e14658fb78','fa17e7f5-ade9-49d4-abf3-dc3722711504','aca5e15d-9f4c-4c79-b906-f7e868b3abc5','member',20,null,'active');
-- Eddy USED to be member of LETS Lebbeke, but is not any longer.
INSERT INTO "partyrelations" VALUES('cf6267a8-f24e-48fe-a6b8-2356a1ab8e6b','437d9b64-a3b4-467c-9abe-e9410332c1e5','aca5e15d-9f4c-4c79-b906-f7e868b3abc5','member',0,null,'inactive');
-- Leen DB is a member of LETS Hamme
INSERT INTO "partyrelations" VALUES('912ae080-29fa-4387-b031-c594167601e0','abcb3c6e-721e-4f7c-ae4a-935e1980f15e','0a98e68d-1fb9-4a31-a4e2-9289ee2dd301','member',-20,null,'active');
-- Emmanuella is a member of LETS Hamme
INSERT INTO "partyrelations" VALUES('d7669476-91ef-420b-99cd-ac906f985481','508f9ec9-df73-4a55-ad42-32839abd1760','0a98e68d-1fb9-4a31-a4e2-9289ee2dd301','member',20,null,'active');

-- Contactdetails key,type,label,street,streetnumber,streetbus,zipcode,city,latitude,longitude,value,public
-- Anna De Vlaming
INSERT INTO "contactdetails" VALUES('843437b3-29dd-4704-afa8-6b06824b2e92','address','thuis','Ijzerenweg','14',null,'9280','Lebbeke',50.9961341,4.1464628,null,true);
INSERT INTO "partycontactdetails" VALUES('986b91dd-1bcc-4703-ae8d-6799442a7518','5df52f9f-e51f-4942-a810-1496c51e64db','843437b3-29dd-4704-afa8-6b06824b2e92');
INSERT INTO "contactdetails" VALUES('b059ef61-340c-45d8-be4f-02436bcc03d9','email',null,null,null,null,null,null,null,null,'anna@email.be',true);
INSERT INTO "partycontactdetails" VALUES('469062e5-0c7c-4c0b-9db9-6e1e1676da9c','5df52f9f-e51f-4942-a810-1496c51e64db','b059ef61-340c-45d8-be4f-02436bcc03d9');
-- Steven Buytink
INSERT INTO "contactdetails" VALUES('3266043e-c70d-4bb4-b0ee-6ff0ae42ce44','address','thuis','Stationstraat','34',null,'9280','Lebbeke',51.0025491,4.1311224,null,true);
INSERT INTO "partycontactdetails" VALUEs('494367e8-4f7a-4e2a-98c1-d33da8c92257','fa17e7f5-ade9-49d4-abf3-dc3722711504','3266043e-c70d-4bb4-b0ee-6ff0ae42ce44');
INSERT INTO "contactdetails" VALUES('77818c02-b15c-4304-9ac1-776dbb376770','email',null,null,null,null,null,null,null,null,'steven@email.be',true);
INSERT INTO "partycontactdetails" VALUES('1cd5baa2-7838-4d84-8a6b-78a85892425c','fa17e7f5-ade9-49d4-abf3-dc3722711504','77818c02-b15c-4304-9ac1-776dbb376770');
-- Rudi Rudolf has only an email
INSERT INTO "contactdetails" VALUES('351cbc67-fb30-4e2e-afd8-f02243148c26','email',null,null,null,null,null,null,null,null,'rudi@email.be',true);
INSERT INTO "partycontactdetails" VALUES('d9a89658-a873-4d53-ab43-5fd4c57a45b8','eb6e3ad7-066f-4357-a582-dfb31e173606','351cbc67-fb30-4e2e-afd8-f02243148c26');
-- LETS Dendermonde
INSERT INTO "contactdetails" VALUES('96de9531-d777-4dca-9997-7a774d2d7595','address',null,'Beekveldstraat','1a','2','9280','Lebbeke',50.9948538,4.1473891,null,true);
INSERT INTO "partycontactdetails" VALUES('5e47192d-1957-4959-89bb-3418ab296080','8bf649b4-c50a-4ee9-9b02-877aa0a71849','96de9531-d777-4dca-9997-7a774d2d7595');

-- Transactions
-- Anna -> Steven 20
INSERT INTO "transactions" VALUES('e068c284-26f1-4d11-acf3-8942610b26e7','5df52f9f-e51f-4942-a810-1496c51e64db','fa17e7f5-ade9-49d4-abf3-dc3722711504',20,null);
-- Leen -> Emmanuella 20, related to message by Leen
INSERT INTO "transactions" VALUES('1ffc9267-b51f-4970-91a2-ae20f4487f78','abcb3c6e-721e-4f7c-ae4a-935e1980f15e','508f9ec9-df73-4a55-ad42-32839abd1760',20,'Merci voor de courgette');

-- Transaction trace
-- Anna -> Steven 20
INSERT INTO "transactionrelations" VALUES('cd5dfc1a-662d-4fb9-b322-c4676722388a','e068c284-26f1-4d11-acf3-8942610b26e7','419e6446-9b3e-4e7d-9381-0c38af0b316a',-20);
INSERT INTO "transactionrelations" VALUES('525fbf3b-5886-47e3-a08a-8b5273a944cb','e068c284-26f1-4d11-acf3-8942610b26e7','db41c12a-a521-443a-97f1-f0e14658fb78',20);
-- Leen -> Emmanuella 20
INSERT INTO "transactionrelations" VALUES('1fda908c-66c1-4b42-921c-562c3c4a2e56','1ffc9267-b51f-4970-91a2-ae20f4487f78','912ae080-29fa-4387-b031-c594167601e0',-20);
INSERT INTO "transactionrelations" VALUES('ebf2b62d-684f-4f60-bcd0-c94c56e9129f','1ffc9267-b51f-4970-91a2-ae20f4487f78','d7669476-91ef-420b-99cd-ac906f985481',20);

-- key,author,title,description,eventdate,amount,unit,tags[], photos[], created, modified, expires
-- Messages
-- For Anna
INSERT INTO "messages" VALUES('a998ff05-1291-4399-8604-16001015e147','5df52f9f-e51f-4942-a810-1496c51e64db','Help met windows 8','Ik ben meer vertrouwd met windows 7, en weet soms niet waar iets staat. Wie kan me wat hulp/advies geven.',null,20,'uur',ARRAY['dienst','vraag'],null,'2015-01-13','2015-01-14','2016-01-13');
INSERT INTO "messages" VALUES('b7c41d85-687d-4f9e-a4ef-0c67515cbb63','5df52f9f-e51f-4942-a810-1496c51e64db','Rabarberchutnet','Zelfgemaakte chutney van rabarber met abrikoos, limoen, gember, pepertjes en nog andere kruiden.',null,5,'potje (150gr)',ARRAY['goed','aanbod','artisanaal'],null,'2015-01-13','2015-01-14','2016-01-13');
INSERT INTO "messages" VALUES('1f2e1d34-c3b7-42e8-9478-45cdc0839427','5df52f9f-e51f-4942-a810-1496c51e64db','Vegetarisch kookles','Ben je pas veggie, of wil je dat graag worden ? Ik geef je graag wat meer uitleg, onder het bereiden van een lekker gerecht. Leer zélf lekker eten klaar te maken !',null,20,'uur',ARRAY['dienst','aanbod','huishoudelijk','koken'],null,'2015-01-13','2015-01-14','2016-01-13');
INSERT INTO "messages" VALUES('0cc3d15f-47ef-450a-a0ac-518202d7a67b','5df52f9f-e51f-4942-a810-1496c51e64db','Bio Asperges','Ik heb, zoals elk voorjaar, een overproductie aan zelfgekweekte bio-asperges. Wie wil er een bussel ? Ik kan ze komen brengen (per fiets).',null,15,'bussel',ARRAY['goed','aanbod','artisanaal','tuin'],null,'2015-01-23','2015-01-25','2015-05-01');
-- reply by Steven to previous message from Anna.
-- no tags, no pictures, no expiry, no amount.
INSERT INTO "messages" VALUES('e8a73a40-bfcd-4f5a-9f8a-9355cc956af0','fa17e7f5-ade9-49d4-abf3-dc3722711504',null,'Ik wil wel een aantal asperges letsen.',null,null,null,ARRAY[]::text[],ARRAY[]::text[],'2015-01-27','2015-01-27',null);
INSERT INTO "messagerelations" VALUES('cc03a9d4-1aef-4c8f-9b05-7b39be514a67','e8a73a40-bfcd-4f5a-9f8a-9355cc956af0','0cc3d15f-47ef-450a-a0ac-518202d7a67b','response_private');
                              
-- For Steven
INSERT INTO "messages" VALUES('642f3d85-a21e-44d0-b6b3-969746feee9b','fa17e7f5-ade9-49d4-abf3-dc3722711504','Indisch Veggie Etentje','Wie heeft er zin om mee aan te schuiven aan ons veggie Indisch buffet ? Er is plaats voor maximum 16 personen.','2015-04-04',15,'persoon',ARRAY['dienst','aanbod','evenement','eten'],null,'2015-02-03','2015-02-03','2015-04-04');
INSERT INTO "messages" VALUES('d1c23a0c-4420-4bd3-9fa0-d542b0155a15','fa17e7f5-ade9-49d4-abf3-dc3722711504','Defecte schakelaar','Eén van de schakelaars in mijn living is defect... Wie zou dat voor mij kunnen herstellen ?', null, 20, 'uur',ARRAY['dienst','vraag','herstellen'],null,'2015-02-03','2015-02-03','2015-04-01');

-- For Leen
INSERT INTO "messages" VALUES('e24528a5-b12f-417a-a489-913d5879b895','abcb3c6e-721e-4f7c-ae4a-935e1980f15e','Mooie planten in de aanbieding',null,null,5,'plant',ARRAY['goed','aanbod'],null,'2015-01-11','2015-01-11','2016-01-11');

-- For Rudi
INSERT INTO "messages" VALUES('11f2229f-1dea-4c5a-8abe-2980b2812cc4','eb6e3ad7-066f-4357-a582-dfb31e173606','Website op maat maken','Ik maak een eenvoudige, moderne website, op maat voor jouw project, organisatie of activiteit',null,20,'uur',ARRAY['dienst','aanbod'],null,'2015-06-01','2015-06-01','2016-06-01');

-- Contact details for event
INSERT INTO "contactdetails" VALUES('3362d325-cf19-4730-8490-583da50e114e','address',null,'Stationstraat','15',null,'9280','Lebbeke',51.0018547,4.1304841,null,true);
INSERT INTO "messagecontactdetails" VALUES('aac80841-3e05-4139-b8de-8bb5159f893c','d1c23a0c-4420-4bd3-9fa0-d542b0155a15','3362d325-cf19-4730-8490-583da50e114e');

-- key, message, party
-- Messages posted to LETS Lebbeke
-- For Anna
INSERT INTO "messageparties" VALUES('1f4cf370-683d-4c87-8523-2e2061706dbc','a998ff05-1291-4399-8604-16001015e147','aca5e15d-9f4c-4c79-b906-f7e868b3abc5');
INSERT INTO "messageparties" VALUES('4f386747-865e-4052-b62d-18154c239b77','b7c41d85-687d-4f9e-a4ef-0c67515cbb63','aca5e15d-9f4c-4c79-b906-f7e868b3abc5');
INSERT INTO "messageparties" VALUES('8dd608e1-17c1-449a-a161-a4a19c471e4f','1f2e1d34-c3b7-42e8-9478-45cdc0839427','aca5e15d-9f4c-4c79-b906-f7e868b3abc5');
INSERT INTO "messageparties" VALUES('df0dfbce-6bb8-4eff-b3aa-0e24a825ccec','0cc3d15f-47ef-450a-a0ac-518202d7a67b','aca5e15d-9f4c-4c79-b906-f7e868b3abc5');
-- For Steven
INSERT INTO "messageparties" VALUES('822e363c-962a-466a-a438-56ba6235c542','642f3d85-a21e-44d0-b6b3-969746feee9b','aca5e15d-9f4c-4c79-b906-f7e868b3abc5');
INSERT INTO "messageparties" VALUES('724eed7f-cee5-466b-8013-a0d1990d7622','d1c23a0c-4420-4bd3-9fa0-d542b0155a15','aca5e15d-9f4c-4c79-b906-f7e868b3abc5');
-- Messages posted to LETS Dendermonde
-- For Rudi
INSERT INTO "messageparties" VALUES('fe670dab-42ac-4f7d-b208-9d7b4a05e7e7','11f2229f-1dea-4c5a-8abe-2980b2812cc4','8bf649b4-c50a-4ee9-9b02-877aa0a71849');
-- Messages posted to LETS Hamme
-- For Leen
INSERT INTO "messageparties" VALUES('568a36bf-a1bb-4fdf-8abc-eb7913c88461','e24528a5-b12f-417a-a489-913d5879b895','0a98e68d-1fb9-4a31-a4e2-9289ee2dd301');

-- Transactions that are related to a specific message.
-- key, message, transaction
INSERT INTO "messagetransactions" VALUES('fd179b3f-9beb-4597-b0cb-d3b03ca84026','e24528a5-b12f-417a-a489-913d5879b895','1ffc9267-b51f-4970-91a2-ae20f4487f78');

------------------
-- Plugin data
------------------

-- key, name, description, apikey, permissions, configurationschema
INSERT INTO "plugins" VALUES('7bd68a4b-138e-4228-9826-a002468222de','mail','A plugin that sends e-mails on a regular basis, and in general turns your mailbox in to a fully functioning user interface.','c40176e1-5d18-4b2a-a7b9-58a0a5b5f1b7',ARRAY['messages-read','parties-read','transactions-read'],'{}');

-- LETS Dendermonde authorizes plugin "mail"
-- key, plugin, party
INSERT INTO "pluginauthorisations" VALUES('567b55cc-987d-4c71-bbf1-7e53d5388f4d','7bd68a4b-138e-4228-9826-a002468222de','8bf649b4-c50a-4ee9-9b02-877aa0a71849');

-- For LETS Dendermonde the "mail" plugin stores the last send date for it's mails
-- key, plugin, resource (text:permalink), data
INSERT INTO "plugindata" VALUES('ebdd1d34-d11c-4950-a93e-fe76aa72a535','7bd68a4b-138e-4228-9826-a002468222de','/parties/8bf649b4-c50a-4ee9-9b02-877aa0a71849','{ "lastexec" : "2015-01-01T13:00:00Z" }'::jsonb);