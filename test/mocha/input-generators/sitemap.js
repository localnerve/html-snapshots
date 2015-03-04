/* global describe, it, before */
var assert = require("assert");
var path = require("path");
var rimraf = require("rimraf").sync;
var factory = require("../../../lib/input-generators");
var server = require("../../server");
var options = require("../../helpers/options");
var smHelper = require("../../helpers/sitemap");
var port = 9333;

describe("input-generator", function() {

  // NOTE: see main input-generator test suite for the standard coverage tests
  // This is just about specific sitemap option processing

  describe("sitemap", function() {

    before(function() {
      server.start(path.join(__dirname, "./server"), port);
    });

    var timeToWait = 300; // milliseconds to wait to record a result

    var outputDir = path.join(__dirname, "./snapshots");
    var urls = [
      "/",
      "/one",
      "/two",
      "/three",
      "/four/five",
      "/six"
    ];
    var sitemapInputGenerators = [
      {
        name: "sitemap-file",
        _testFile: path.join(__dirname, "/server/test_sitemap_dynamic.xml"),
        input: factory.create("sitemap"),
        options: options.decorate({
          source: path.join(__dirname, "/server/test_sitemap_dynamic.xml"),
          sitemapPolicy: true,
          outputDir: outputDir,
          outputDirClean: false
        })
      },
      {
        name: "sitemap-url",
        _testFile: path.join(__dirname, "/server/test_sitemap_dynamic.xml"),
        input: factory.create("sitemap"),
        options: options.decorate({
          source: "http://localhost:"+port+"/test_sitemap_dynamic.xml",
          sitemapPolicy: true,
          outputDir: outputDir,
          outputDirClean: false
        })
      }
    ];
    var lmcfCases = {
      previousNo: [
        {
          // lastmod policy element missing
          // no matter how many are current, they always all get processed
          name: "lastmod",
          missing: smHelper.smElement.lastMod,
          some: {
            current: 2,
            cbLimit: urls.length
          },
          all: {
            current: 0,
            cbLimit: urls.length
          },
          none: {
            current: urls.length,
            cbLimit: urls.length
          }
        },
        {
          // changefreq policy element missing
          // no matter how many are current, they always all get processed
          name: "changefreq",
          missing: smHelper.smElement.changeFreq,
          some: {
            current: 2,
            cbLimit: urls.length
          },
          all: {
            current: 0,
            cbLimit: urls.length
          },
          none: {
            current: urls.length,
            cbLimit: urls.length
          }
        }
      ],
      previousYes: [
        {
          // lastmod policy element missing
          // should obey meaningful current behavior for some, all, none
          name: "lastmod",
          missing: smHelper.smElement.lastMod,
          some: {
            current: 2,
            cbLimit: urls.length - 2
          },
          all: {
            current: 0,
            cbLimit: urls.length
          },
          none: {
            current: urls.length,
            cbLimit: 0
          }
        },
        {
          // changefreq policy element missing
          // should obey meaningful current behavior for some, all, none
          name: "changefreq",
          missing: smHelper.smElement.changeFreq,
          some: {
            current: 2,
            cbLimit: urls.length - 2
          },
          all: {
            current: 0,
            cbLimit: urls.length
          },
          none: {
            current: urls.length,
            cbLimit: 0
          }
        }
      ]
    };

    var baseCases = [
      {
        // all policy elements missing
        // no matter how many are current, they always all get processed
        name: "all",
        missing: smHelper.smElement.all,
        some: {
          current: 2,
          cbLimit: urls.length
        },
        all: {
          current: 0,
          cbLimit: urls.length
        },
        none: {
          current: urls.length,
          cbLimit: urls.length
        }
      },
      {
        // no policy elements missing
        // current items are not processed
        name: "none",
        missing: smHelper.smElement.none,
        some: {
          current: 2,
          cbLimit: urls.length - 2
        },
        all: {
          current: 0,
          cbLimit: urls.length
        },
        none: {
          current: urls.length,
          cbLimit: 0
        }
      }
    ];

    // main test cases
    var casesPreviousNo = baseCases.concat(lmcfCases.previousNo);
    var casesPreviousYes = baseCases.concat(lmcfCases.previousYes);

    // Run a dynamic sitemap input processing test.
    // Make a dynamic sitemap according to spec.
    // After sitemap made, process the input calling the given `inputCallback`.
    // After input processing started, evaluate the result calling `resultCallback`.
    function dynSMIP(gen, urls, current, missing, inputCallback, resultCallback) {

      smHelper.buildSitemapWithPolicy(gen._testFile, urls, current, missing, function() {
        resultCallback( gen.input.run(gen.options, inputCallback) );
      });
    }

    // Create a callback that tests for a truthy result
    function trueResult(limit, done) {
      return function(result) {
        assert.equal(true, result);
        if (limit === 0) {
          setTimeout(done, timeToWait);
        }
      };
    }

    // Create a callback counter callback
    // This makes a callback that checks to make sure the number of times
    //   it is called back does not exceed the given `limit`. Once that limit
    //   is reached, it calls the given `done` callback.
    // In the interim, if it is called more than the limit, it asserts an error.
    function callbackCounter(limit, done) {
      var counter = 0;
      var cb;
      if (limit === 0) {
        cb = function() {
          assert.fail("unexpected", "callback", "input was processed unexpectedly", "function");
        };
      } else {
       cb = function() {
          assert.equal(true, counter++ < limit);
          if (counter === limit) {
            setTimeout(done, timeToWait);
          }
        };
      }
      return cb;
    }

    sitemapInputGenerators.forEach(function(gen) {

      describe("policy option true, "+gen.name+",", function() {

        describe("no previous run output,", function() {
          
          before(function() {
            // don't let previous run output interfere
            rimraf(outputDir);
          });

          casesPreviousNo.forEach(function(testCase) {

            describe("missing "+testCase.name+",", function() {

              it("should process some of the expected number of out-of-date urls", function(done) {

                dynSMIP(gen, urls, testCase.some.current, testCase.missing,
                  callbackCounter(testCase.some.cbLimit, done),
                  trueResult(testCase.some.cbLimit, done)
                );
              });

              it("should process all urls if they're all out-of-date", function(done) {
                
                dynSMIP(gen, urls, testCase.all.current, testCase.missing,
                  callbackCounter(testCase.all.cbLimit, done),
                  trueResult(testCase.all.cbLimit, done)
                );
              });

              it("should process none of the urls if they're all up-to-date", function(done) {

                dynSMIP(gen, urls, testCase.none.current, testCase.missing,
                  callbackCounter(testCase.none.cbLimit, done),
                  trueResult(testCase.none.cbLimit, done)
                );
              });

            });
          });
        });

        describe("has previous run output,", function() {

          casesPreviousYes.forEach(function(testCase) {

            describe("missing "+testCase.name+",", function() {

              it("should process some of the expected number of out-of-date urls", function(done) {

                smHelper.buildTestFiles(gen.options, urls, testCase.some.current);

                dynSMIP(gen, urls, testCase.some.current, testCase.missing,
                  callbackCounter(testCase.some.cbLimit, done),
                  trueResult(testCase.some.cbLimit, done)
                );
              });

              it("should process all urls if they're all out-of-date", function(done) {
                
                smHelper.buildTestFiles(gen.options, urls, testCase.all.current);

                dynSMIP(gen, urls, testCase.all.current, testCase.missing,
                  callbackCounter(testCase.all.cbLimit, done),
                  trueResult(testCase.all.cbLimit, done)
                );
              });

              it("should process none of the urls if they're all up-to-date", function(done) {

                smHelper.buildTestFiles(gen.options, urls, testCase.none.current);

                dynSMIP(gen, urls, testCase.none.current, testCase.missing,
                  callbackCounter(testCase.none.cbLimit, done),
                  trueResult(testCase.none.cbLimit, done)
                );
              });

            });
          });
        });

      });
    });
  });
});