/*
 * grunt-htmlSnapshots
 * A grunt task for html-snapshots
 *
 * Copyright (c) 2013 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
module.exports = function(grunt) {

  // Internal lib.
  var ss = require('../lib/html-snapshots');

  grunt.registerMultiTask('htmlsnapshots', 'Generate html snapshots.', function() {

    ss.run(this.options);
/* 
  {
      input: this.data.input,                     // inputGenerator: "robots", "textfile", "array"
      source: this.data.source,                   // inputFile or Array
      outputDir: this.data.outputDir,             // defaults to ./snapshots      
      outputDirClean: this.data.outputDirClean,   // defaults to false, set to true to clean your output directory
      hostname: this.data.hostname,               // defaults to localhost
      port: the port                
      selector: this.data.selector,               // function(url) { return myselectors[url]; } or scalar for all
      timeout: this.data.timeout,                 // function(url) { return mytimeouts[url]; } or scalar for all      
      phantomjs: this.data.phantomjs,             // reference to phantomjs, default "phantomjs" global
      snapshotScript: this.data.snapsnotScript,   // defaults to "snapshotSingle"      
      protocol: this.data.protocol,               // defaults to http
      checkInterval: this.data.checkInterval      // interval to check if page done, defaults to 250ms
  }
*/
  });

};