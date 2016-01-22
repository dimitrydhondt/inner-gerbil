#!/bin/bash
cat sql/schema.sql sql/testdata.sql | heroku pg:psql
git push heroku master

