#!/bin/bash
git push heroku master
cat sql/clean-database.sql sql/schema.sql sql/testdata.sql | heroku pg:psql
echo "GRANT ALL PRIVILEGES ON SCHEMA innergerbil TO gerzbtzzhunrfy;" | heroku pg:psql
echo "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA innergerbil TO gerzbtzzhunrfy;" | heroku pg:psql
echo "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA innergerbil TO gerzbtzzhunrfy;" | heroku pg:psql
echo "ALTER USER gerzbtzzhunrfy SET search_path = innergerbil;" | heroku pg:psql

