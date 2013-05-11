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
var common = require("./common");
var inputFactory = require("./input-generators");
var snapshotScript = "./phantom/snapshotSingle.js";
var phantomJS = "phantomjs";

var defaults = {
  inputGenerator: "robots",
  waitForAll: 100000,
  phantomjs: phantomJS,
  snapshotScript: path.join(__dirname, snapshotScript),
  snapshotDirClean: false
};

/**
 * Message for poll exceeded
 */
function pollExceeded(options) {
  return "*** Snapshots exited prematurely ***"+
  "\nTry:"+
  "\n  Increase waitForAll count to wait for all snapshots to complete."+
  "\n  Increase value returned by the timeout function for the url(s) timing out."+
  "\n  Check arguments:"+
  "\n    waitForAll="+options.waitForAll+
  "\n    timeout="+(typeof (options.timeout()) !== "undefined" ? options.timeout() : "(can vary by url)")+
  "\n    snapshotScript="+options.snapshotScript+
  "\n    phantomjs="+options.phantomjs+
  "\n    protocol="+options.protocol+
  "\n    hostname="+options.hostname
  ;
}

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

    if (count >= max)
      console.error(pollExceeded(options));
    else
      result = true;
  }

  return result;
}

module.exports = {
  /**
   * Run all the snapshots for the requested inputGenerator
   */
  run: function(options) {
    options = options || {};

    // ensure our defaults are represented in the options
    common.ensure(options, defaults);

    // create the inputGenerator, default to robots
    var inputGenerator = inputFactory.create(options.inputGenerator);

    // clean the snapshot output directory
    if (options.snapshotDirClean)
      deleteFolderRecursive(options.snapshotDir);

    // generate input for the snapshots
    var cp, snapshots = inputGenerator.run(options);

    // create process control stuff
    var procCtrl = { error: false };
    var errorHandler = (function(pc) {
      return function(e) {
        pc.error = true;
        console.error(e);
      };
    })(procCtrl);

    // spawn each single snapshot
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

    var result = snapshots.length > 0 && !procCtrl.error;

    // wait for all snapshots to complete if a poll counter was supplied.
    if (options.waitForAll > 0 && result)
      result = waitForAll(options, snapshots);

    return result ? !procCtrl.error : result;
  }
};
