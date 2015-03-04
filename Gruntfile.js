module.exports = function(grunt) {
  // load all grunt tasks
  require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);
  
  grunt.initConfig({

    coveralls: {
      options: {
        // just warn if we can't transmit coverage to coveralls
        force: true
      },
      all: {
        src: "coverage/lcov.info"
      }
    },

    jshint: {
      options: {
        jshintrc: true
      },
      all: [
        "lib/**/*.js"
      ],
      test: {
        options: {
          '-W083': true, // allow functions in loops for tests
        },
        files: {
          src: ["test/mocha/**/*.js"]
        }
      }
    },

    mochaTest: {
      options: {
        reporter: "spec"
      },
      all: {
        src: [ "test/mocha/**/*.js" ]
      },
      common: {
        src: [ "test/mocha/common/*js" ]
      },
      "input-generators": {
        src: [ "test/mocha/input-generators/*.js" ]
      },
      "input-generators-test": {
        src: [ "test/mocha/input-generators/test.js" ]
      },      
      async: {
        src: [ "test/mocha/async/*.js" ]
      },
      "html-snapshots": {
        src: [ "test/mocha/html-snapshots/*.js" ]
      },
      coverage: {
        options: {
          reporter: "lcov"
        }
      }
    }
  });

  grunt.registerTask("default", ["jshint", "mochaTest:all"]);
  grunt.registerTask("test", ["mochaTest:all"]);
  grunt.registerTask("lint", ["jshint"]);
};