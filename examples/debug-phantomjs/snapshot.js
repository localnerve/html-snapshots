/*
 * Debug PhantomJS processing of a page on a sample website
 * 
 * Uses sitemap.xml to snapshot a sample website, but holds one page for debugging.
 * 
 * Demonstrates how to walk through the html-snapshots default script.
 * Demonstrates phantomjsOptions usage on a per-page basis.
 * 
 */
var path = require("path");
var util = require("util");
var assert = require("assert");
var htmlSnapshots = require("html-snapshots");

// Assert if NOT an error
function mustBeError(err) {
  assert.throws(
    function() {
      assert.ifError(err);
    },
    function(err) {
      return !!err;
    }
  );
}

// For debugging, it might make more sense to do this for a single page of interest using array input,
//  but this also demonstrates the use of phantomjsOptions in the per-page case.
htmlSnapshots.run({
  input: "sitemap",
  source: "http://enigmatic-refuge-9006.herokuapp.com/sitemap.xml",
  outputDir: path.join(__dirname, "./tmp"),
  outputDirClean: true,
  selector: ".page-content",
  timeout: 15000,
  phantomjsOptions: {
    // The key must exactly match the loc as defined in the sitemap.xml
    "http://enigmatic-refuge-9006.herokuapp.com:80/hello-world": "--remote-debugger-port=9000"
  }
}, function(err, completed) {  

  console.log("completed snapshots:");
  console.log(util.inspect(completed));

  // We expect the hello-world page will timeout because we've held it in the debugger
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