module.exports = function(grunt) {
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-contrib-jshint");

  grunt.initConfig({

    jshint: {
      all: [
        "src/**/*.js"
      ]
    },

    mochaTest: {
      normal: [ "test/mocha/**/*.js" ]
    },
    mochaTestConfig: {
      normal: {
        options: {
        }
      }
    }
  });

  grunt.registerTask("default", ["jshint", "mochaTest"]);
};