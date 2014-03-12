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
      normal: [ "test/mocha/**/*.js" ],
      gen: [ "test/mocha/input-generators/*.js" ]
    }
  });

  grunt.registerTask("default", ["jshint", "mochaTest:normal"]);
  grunt.registerTask("test", ["mochaTest:normal"]);
  grunt.registerTask("lint", ["jshint"]);
};