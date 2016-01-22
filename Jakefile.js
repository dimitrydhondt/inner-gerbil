/*eslint no-console: 0*/
/*global desc jake task complete*/
var os = require('os');

desc('Cleans database.');
task('clean-database', {async: true}, function () {
  'use strict';
  var cmds = [
    'psql -U postgres --echo-all < ./sql/clean-database.sql'
  ];
  jake.exec(cmds, {printStdout: true}, function () {
    console.log('Database cleaned.');
    complete();
  });
});

desc('Recreates database.');
task('create-database', ['clean-database'], {async: true}, function () {
  'use strict';
  var cmds = [
    'psql -U postgres --echo-all < ./sql/schema.sql',
    'psql -U postgres --echo-all < ./sql/privileges.sql',
    'psql -U postgres --echo-all < ./sql/testdata.sql'
  ];
  jake.exec(cmds, {printStdout: true}, function () {
    console.log('Database created.');
    complete();
  });

  // Test to log OS version if we need to do something different for windows
  console.log(os.platform());
  console.log(os.release());
});
