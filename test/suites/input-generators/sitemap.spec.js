/**
 * Sitemap tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { describe, it, before } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const factory = require("../../../lib/input-generators/index.js");
const server = require("../../server/index.js");
const options = require("../../helpers/options.js");
const smHelper = require("../../helpers/sitemap.js");
const { makeCallback } = require("../html-snapshots/utils.js");
const port = 9033;

describe("input-generator", () => {

  // NOTE: see main input-generator test suite for the standard coverage tests
  // This is just about specific sitemap option processing

  describe("sitemap", () => {

    before(() => {
      server.start(path.join(__dirname, "./server"), port);
    });

    const timeToWait = 300; // milliseconds to wait to record a result

    const outputDir = path.join(__dirname, "./snapshots");
    const urls = [
      "/",
      "/one",
      "/two",
      "/three",
      "/four/five",
      "/six"
    ];
    const sitemapInputGenerators = [
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
    const lmcfCases = {
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

    const baseCases = [
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
    const casesPreviousNo = baseCases.concat(lmcfCases.previousNo);
    const casesPreviousYes = baseCases.concat(lmcfCases.previousYes);

    // Run a dynamic sitemap input processing test.
    // Make a dynamic sitemap according to spec.
    // After sitemap made, process the input calling the given `inputCallback`.
    // After input processing started, evaluate the result calling `resultCallback`.
    function dynSMIP (gen, urls, current, missing, inputCallback, resultCallback) {
      smHelper.buildSitemapWithPolicy(gen._testFile, urls, current, missing,
        function () {
        resultCallback( gen.input.run(gen.options, inputCallback) );
      });
    }

    // Create a callback that tests for a truthy result
    function trueResult (limit, done) {
      return function (result) {
        result
          .then(function () {
            assert.ok(true);
          })
          .catch(function (err) {
            assert.fail("run", "fail", err.toString(), "should not");
          })
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
    function callbackCounter (limit, done) {
      let counter = 0;
      let cb;
      if (limit === 0) {
        cb = function () {
          assert.fail("unexpected", "callback", "input was processed unexpectedly", "function");
        };
      } else {
       cb = function () {
          assert.equal(true, counter++ < limit);
          if (counter === limit) {
            setTimeout(done, timeToWait);
          }
        };
      }
      return cb;
    }

    sitemapInputGenerators.forEach(gen => {

      describe("policy option true, "+gen.name+",", () => {

        describe("no previous run output,", () => {

          before(() => {
            // don't let previous run output interfere
            fs.rmSync(outputDir, { recursive: true, force: true });
          });

          casesPreviousNo.forEach(testCase => {

            describe("missing "+testCase.name+",", () => {

              it("should process some of the expected number of out-of-date urls", () => {
                return new Promise((resolve, reject) => {
                  const done = makeCallback(resolve, reject);
                  dynSMIP(gen, urls, testCase.some.current, testCase.missing,
                    callbackCounter(testCase.some.cbLimit, done),
                    trueResult(testCase.some.cbLimit, done)
                  );
                });
              });

              it("should process all urls if they're all out-of-date", () => {
                return new Promise((resolve, reject) => {
                  const done = makeCallback(resolve, reject);
                  dynSMIP(gen, urls, testCase.all.current, testCase.missing,
                    callbackCounter(testCase.all.cbLimit, done),
                    trueResult(testCase.all.cbLimit, done)
                  );
                });
              });

              it("should process none of the urls if they're all up-to-date", () => {
                return new Promise((resolve, reject) => {
                  const done = makeCallback(resolve, reject);
                  dynSMIP(gen, urls, testCase.none.current, testCase.missing,
                    callbackCounter(testCase.none.cbLimit, done),
                    trueResult(testCase.none.cbLimit, done)
                  );
                });
              });

            });
          });
        });

        describe("has previous run output,", () => {

          casesPreviousYes.forEach(testCase => {

            describe("missing "+testCase.name+",", () => {

              it("should process some of the expected number of out-of-date urls", () => {
                return new Promise((resolve, reject) => {
                  const done = makeCallback(resolve, reject);
                  smHelper.buildTestFiles(gen.options, urls, testCase.some.current);

                  dynSMIP(gen, urls, testCase.some.current, testCase.missing,
                    callbackCounter(testCase.some.cbLimit, done),
                    trueResult(testCase.some.cbLimit, done)
                  );
                });
              });

              it("should process all urls if they're all out-of-date", () => {
                return new Promise((resolve, reject) => {
                  const done = makeCallback(resolve, reject);
                  smHelper.buildTestFiles(gen.options, urls, testCase.all.current);

                  dynSMIP(gen, urls, testCase.all.current, testCase.missing,
                    callbackCounter(testCase.all.cbLimit, done),
                    trueResult(testCase.all.cbLimit, done)
                  );
                });
              });

              it("should process none of the urls if they're all up-to-date", () => {
                return new Promise((resolve, reject) => {
                  const done = makeCallback(resolve, reject);
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
});
