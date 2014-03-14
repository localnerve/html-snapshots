module.exports = function(grunt) {
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-contrib-jshint");

  grunt.initConfig({

    jshint: {
      all: [
        "lib/**/*.js"
        //, "test/mocha/**/*.js"
      ]
    },

    mochaTest: {
      all: [ "test/mocha/**/*.js" ],
      "input-generators": [ "test/mocha/input-generators/*.js" ],
      async: [ "test/mocha/async/*.js" ],
      "html-snapshots": [ "test/mocha/html-snapshots/*.js" ]
    }
  });

  grunt.registerTask("default", ["jshint", "mochaTest:all"]);
  grunt.registerTask("test", ["mochaTest:all"]);
  grunt.registerTask("lint", ["jshint"]);
};