#!/bin/bash
# clean database
cat sql/clean-database.sql | sudo sudo -u postgres psql

# create database
cat sql/schema.sql sql/testdata.sql | sudo sudo -u postgres psql

# grant privileges
cat sql/privileges.sql | sudo sudo -u postgres psql
