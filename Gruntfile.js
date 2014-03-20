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
      options: {
        reporter: "spec"
      },
      all: {
        src: [ "test/mocha/**/*.js" ]
      },
      "input-generators": {
        src: [ "test/mocha/input-generators/*.js" ]
      },
      async: {
        src: [ "test/mocha/async/*.js" ]
      },
      "html-snapshots": {
        src: [ "test/mocha/html-snapshots/*.js" ]
      }
    }
  });

  grunt.registerTask("default", ["jshint", "mochaTest:all"]);
  grunt.registerTask("test", ["mochaTest:all"]);
  grunt.registerTask("lint", ["jshint"]);
};