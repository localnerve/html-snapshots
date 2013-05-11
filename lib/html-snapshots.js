/*
 * html-snapshots.js
 *
 * Produce html snapshots using for a website for SEO purposes.
 * This is required for javascript SPAs or ajax page output.
 * By default, uses a selector to search content to determine if 
 *   a page is "ready" for its html snapshot.
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

/**
 * Dependencies
 */
var fs = require("fs");
var spawn = require("child_process").spawn;
var path = require("path");
var inputFactory = require("./inputGenerators/create");
var snapshotScript = "./phantom/snapshotSingle.js";
var phantomJS = "phantomjs";

/**
 * Utility to recursively delete a folder
 */
function deleteFolderRecursive(p) {
  if(fs.existsSync(p)) {
    fs.readdirSync(p).forEach(function(file,index){
      var curPath = path.join(p,"/" + file);
      if(fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(p);
  }
}

/**
 * Poll the filesystem for child process successful completion or waitForAll count reached.
 * Very yucky, but keeps the script from exiting until all snapshots are complete.
 * This is really handy in a build time situation.
 *
 * there is no sense looking for procCtrl in here, because node is CPU bound for those
 * and this blocks it. Also tried nextTick, but ran out of memory.
 */
function waitForAll(options, snapshots) {
  var result = false;

  if (snapshots.length > 0) {

    var count = 0, max = options.waitForAll, done = false;

    // while not all snapshots successful or waitForAll count not exceeded...
    while (!done && count < max) {
      done = true;
      for (var i in snapshots) {
        if (!fs.existsSync(snapshots[i].outputFile)) {
          done = false;
          break;
        }
      }
      count++;
    }

    //console.log("*** polling at "+count+" of "+max+"");
    if (count >= max) {
      console.error("*** Snapshots exited prematurely ***");
      console.error("Try: Increase waitForAll count to wait for all snapshots to complete.");
      console.error("     Increase value returned by the timeout function for the url(s) timing out.");
      console.error("     Check arguments:"+
                    "\n       waitForAll="+options.waitForAll+
                    "\n       timeout="+(typeof (options.timeout()) !== "undefined" ? options.timeout() : "(can vary by url)")+
                    "\n       snapshotScript="+options.snapshotScript+
                    "\n       phantomjs="+options.phantomjs+
                    "\n       protocol="+options.protocol+
                    "\n       hostname="+options.hostname);
    } else {
      result = true;
    }
  }
  return result;
}

module.exports = {
  /**
   * Run all the snapshots for the requested inputGenerator
   */
  run: function(options) {
    options = options || {};

    // get the correct input object for the requested inputGenerator
    var inputGenerator = inputFactory.create(options.inputGenerator);

    // if no generator was supplied, default to robots
    if (inputFactory.isNull(inputGenerator)) {
      console.log("inputGenerator "+
        (options.inputGenerator ? options.inputGenerator +" ": "")+
        "not found, using robots by default...");
      inputGenerator = inputFactory.create("robots");
    }

    // get the input generator defaults
    var defaults = inputGenerator.defaults;

    // mixin this module's defaults
    defaults["waitForAll"] = 100000;
    defaults["phantomjs"] = phantomJS;
    defaults["snapshotScript"] = path.join(__dirname, snapshotScript);
    defaults["snapshotDirClean"] = false;

    // ensure all defaults are represented in the options
    for (var prop in defaults) {
      if (!options[prop])
        options[prop] = defaults[prop];
    }

    // clean the snapshot output directory
    if (options.snapshotDirClean)
      deleteFolderRecursive(options.snapshotDir);

    // generate input arguments for the snapshots
    var cp, snapshots = inputGenerator.run(options);

    // create process control stuff
    var procCtrl = { error: false };
    var errorHandler = (function(pc) {
      return function(e) {
        pc.error = true;
        console.error(e);
      };
    })(procCtrl);

    // spawn each snapshot
    for (var i = 0;  i < snapshots.length && !procCtrl.error; i++) {
      cp = spawn(
            options.phantomjs,
            [
              options.snapshotScript,
              snapshots[i].outputFile,
              snapshots[i].url,
              snapshots[i].selector,
              snapshots[i].timeout,
              snapshots[i].checkInterval
            ], { cwd: process.cwd(), stdio: "inherit" }
          );
      cp.on("error", errorHandler);
    }

    var result = true;

    // wait for all snapshots to complete if a poll counter was supplied.
    if (options.waitForAll > 0)
      result = waitForAll(options, snapshots);

    return result ? !procCtrl.error : result;
  }
};
