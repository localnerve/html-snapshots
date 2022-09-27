/*
 * Debug PhantomJS processing of a page on a sample website.
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 *
 * Uses sitemap.xml to snapshot a sample website, but holds one page for debugging.
 *
 * Demonstrates how to walk through the html-snapshots default script.
 * Demonstrates phantomjsOptions usage on a per-page basis.
 *
 */
const path = require("path");
const util = require("util");
const assert = require("assert");
const htmlSnapshots = require("html-snapshots");

// Assert if NOT an error
function mustBeError(err) {
  assert.throws(
    () => {
      assert.ifError(err);
    },
    err => !!err
  );
}

// For debugging, it might make more sense to do this for a single page of interest using array input,
//  but this also demonstrates the use of phantomjsOptions in the per-page case.
htmlSnapshots.run({
  input: "sitemap",
  source: "https://www.sitemaps.org/sitemap.xml",
  outputDir: path.join(__dirname, "./tmp"),
  outputDirClean: true,
  selector: "#mainContent",
  timeout: 10000,
  browser: "phantomjs",
  phantomjsOptions: {
    // The key must exactly match the loc as defined in the sitemap.xml
    "https://www.sitemaps.org/protocol.html": "--remote-debugger-port=9000"
  }
}, (err, completed) => {

  console.log("completed snapshots:");
  console.log(util.inspect(completed));

  // We expect the protocol.html page will timeout because we've held it in the debugger
  //   It will succeed if you use --remote-debugger-autorun=true
  //   However, the PhantomJS process instances won't exit so that you can (re)debug
  mustBeError(err);
});

// Now, go open chrome and navigate to http://127.0.0.1:9000
//  1. click "about:blank"
//  2. click "Scripts" tab and find "about:blank" script in dropdown - that's the phantomjs script
//  3. Set some breakpoints
//  4. click the "Console" tab, type `__run()`, hit enter
//  5. Step through and observe whats going on.
//
// More info: http://phantomjs.org/troubleshooting.html
//
// You have to kill PhantomJS instances yourself if you start them with the debug option.
