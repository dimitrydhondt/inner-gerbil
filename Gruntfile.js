/// <binding BeforeBuild='eslint' />
module.exports = function (grunt) {
  'use strict';
  // section 1 - require modules
  require('load-grunt-tasks')(grunt);

  // section 2 - configure grunt
  grunt.initConfig({
    eslint: {
      options: {
        reset: true
      },
      target: ['js/**/*.js', 'test/**/*.js', 'Jakefile.js', 'Gruntfile.js']
    }
  });

  // section 3 - register grunt tasks
  grunt.registerTask('default', ['eslint']);

};
