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
      normal: [ "test/mocha/**/*.js" ]
    }
  });

  grunt.registerTask("default", ["jshint", "mochaTest"]);
  grunt.registerTask("test", ["mochaTest"]);
  grunt.registerTask("lint", ["jshint"]);
};