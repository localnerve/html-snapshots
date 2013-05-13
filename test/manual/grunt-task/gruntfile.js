var path = require("path");
var inputFile = path.join(__dirname, "./test_robots.txt");
module.exports = function(grunt) {
  grunt.loadTasks(path.join(__dirname, "../../../src/tasks/htmlsnapshots"));

  grunt.initConfig({
    htmlsnapshots: {
      options: {
        input: "robots",
        source: inputFile,
        outputDir: "./tmp/snapshots",
        outputDirClean: true,
        hostname: "northstar.local",
        selector: "#dynamic-content",
        timeout: 3000
      }
    }
  });

  grunt.registerTask("default", ["jshint", "mochaTest"]);
};