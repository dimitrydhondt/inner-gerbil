#!/bin/bash
cat sql/clean-database.sql | heroku pg:psql
cat sql/schema.sql | heroku pg:psql
cat sql/testdata.sql | heroku pg:psql
git push heroku master
