#!/bin/bash
cat sql/clean-database.sql | heroku pg:psql
cat sql/schema.sql | heroku pg:psql
cat sql/testdata.sql | heroku pg:psql
git push heroku master
curl -X PUT -u annadv:test -F 'filedata=@/home/ubuntu/workspace/inner-gerbil/img/orange-girl-icon.png' https://inner-gerbil-test.herokuapp.com/parties/5df52f9f-e51f-4942-a810-1496c51e6/profile.png
curl -X PUT -u annadv:test -F 'filedata=@/home/ubuntu/workspace/inner-gerbil/img/orange-boy-icon.png' https://inner-gerbil-test.herokuapp.com/parties/fa17e7f5-ade9-49d4-abf3-dc3722711504/profile.png