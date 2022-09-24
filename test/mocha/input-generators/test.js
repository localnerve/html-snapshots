/**
 * General input generator tests.
 *
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
/* global describe, it, before */
const assert = require("assert");
const path = require("path");
const base = require("../../../lib/input-generators/_base");
const factory = require("../../../lib/input-generators");
const common = require("../../../lib/common");
const server = require("../../server");
const options = require("../../helpers/options");
const port = 8033;

describe("input-generator", function () {

  before(function () {
    server.start(path.join(__dirname, "./server"), port);
  });

  describe("null", function () {
    it("'index' should return a null generator", function () {
      assert.equal(true, factory.isNull(factory.create("index")));
    });

    it("'_common' should return a null generator", function () {
      assert.equal(true, factory.isNull(factory.create("_base")));
    });

    it("'_any' should return a null generator", function () {
      assert.equal(true, factory.isNull(factory.create("_any")));
    });

    it("'notvalid' should return a null generator", function () {
      assert.equal(true, factory.isNull(factory.create("notvalid")));
    });

    it("no input should return a null generator", function () {
      assert.equal(true, factory.isNull(factory.create()));
    });

    it("should have a run method", function () {
      assert.equal(true, typeof factory.create().run === 'function');
    });

    it("run method should return an empty array", function () {
      assert.equal(true, factory.create().run().length === 0);
    });
  });

  const thisOutputDir = path.join(__dirname, "snapshots");

  const inputGenerators = [
    {
      name: "robots",
      input: factory.create("robots"),
      source: path.join(__dirname, "test_robots.txt"),
      remote: [
        `http://localhost:${port}/test_robots.txt`,
        `http://localhost:${port}/test_robots_sitemap.txt`,
        `http://localhost:${port}/test_robots_sitemap_multi.txt`
      ],
      bad: [
        path.join(__dirname, "test_robots_bad.txt"),
        `http://localhost:${port}/test_robots_bad.txt`,
        `http://localhost:${port}/test_robots_sitemap_bad.txt`
      ],
      urls: 5
    },
    {
      name: "textfile",
      input: factory.create("textfile"),
      source: path.join(__dirname, "test_line.txt"),
      urls: 5
    },
    { name: "array", input: factory.create("array"), source:
      // same as urls in sitemap
      [
        "http://northstar.local/",
        "http://northstar.local/contact",
        "http://northstar.local/services/carpets",
        "http://northstar.local/services/test?arg=one",
        "https://northstar.local/services/#hash"
      ],
      urls: 5
    },
    {
      name: "sitemap",
      input: factory.create("sitemap"),
      source: path.join(__dirname, "test_sitemap.xml"),
      remote: [`http://localhost:${port}/test_sitemap.xml`],
      urls: 5
    },
    {
      name: "sitemap-gzip",
      input: factory.create("sitemap"),
      source: path.join(__dirname, "test_sitemap.xml.gz"),
      remote: [`http://localhost:${port}/test_sitemap.xml.gz`],
      bad: [
        path.join(__dirname, "test_sitemap_bad.xml.gz"),
        `http://localhost:${port}/test_sitemap_bad.xml.gz`
      ],
      urls: 5
    },
    {
      name: "sitemap-index",
      input: factory.create("sitemap-index"),
      source: path.join(__dirname, "test_sitemap_index.xml"),
      remote: [`http://localhost:${port}/test_sitemap_index.xml`],
      // this is the total number of pages referenced by sitemaps in test_sitemap_index.
      urls: 17
    },
    {
      name: "sitemap-index-gzip",
      input: factory.create("sitemap-index"),
      source: path.join(__dirname, "test_sitemap_index.xml.gz"),
      remote: [`http://localhost:${port}/test_sitemap_index.xml.gz`],
      // this is the total number of pages referenced by sitemaps in test_sitemap_index.
      urls: 17
    }
  ];

  /**
   * Escape a string for usage in a regular expression.
   */
  function regexEscape(s) {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  function pathToRe (component) {
    return regexEscape(component);
  }

  function urlToPath (url) {
    let result = url;
    if (process.platform === "win32") {
      result = url.replace(/\//g, "\\");
    }
    return result;
  }

  function urlToPathRe (url) {
    let result = url;
    if (process.platform === "win32") {
      result = url.replace(/\//g, "\\\\");
    }
    return result;
  }

  inputGenerators.forEach(function (inputGeneratorTest) {

    describe(inputGeneratorTest.name, function () {

      const globalUrl = inputGeneratorTest.name === "robots" || inputGeneratorTest.name === "textfile";
      const remote = inputGeneratorTest.remote;
      const gen = inputGeneratorTest.input;
      const source = inputGeneratorTest.source;
      const bad = inputGeneratorTest.bad;
      const urls = inputGeneratorTest.urls;

      describe("general behavior", function () {

        it("should return false for null", function () {
          assert.equal(false, factory.isNull(gen));
        });

        it("should have a run method", function (){
          assert.equal(true, typeof gen.run === 'function');
        });

        // requires inputFile not found
        it("should produce no input for defaults and a bogus file", function (done) {
          let doneCalled = false;

          gen.run(options.decorate({
            source: "./bogus/file.txt",
            outputDir: thisOutputDir,
            _abort: function(err) {
              assert.equal(true, !!err);
              doneCalled = true;
              done();
            }
          }), function () {
            assert.fail("input callback should not have been called, unexpected input processed");
          });

          setTimeout(function () {
            if (!doneCalled) {
              done("abort was not called as expected");
            }
          }, 200);
        });

        // requires source to have 'urls' valid entries
        it("should produce input with all defaults and a valid source", function (done) {
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir
          }), function () {
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        // this test has to match the base generator defaults
        it("base defaults should exist in input when requested", function (done) {
          const defaults = base.defaults({});
          defaults.outputDir = thisOutputDir;

          let count = 0;
          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir
          }), function (input) {
            const re1 = new RegExp("^("+defaults.protocol+")://("+defaults.hostname+")/");
            const re2 = new RegExp("^("+pathToRe(defaults.outputDir)+")"+pathToRe(path.sep));

            const m1 = re1.exec(input.url);
            const m2 = re2.exec(input.outputFile);

            if (globalUrl) {
              assert.equal(m1[1], defaults.protocol);
              assert.equal(m1[2], defaults.hostname);
            }

            assert.equal(m2[1], defaults.outputDir);
            assert.equal(defaults.selector, input.selector);
            assert.equal(defaults.timeout, input.timeout);
            assert.equal(defaults.checkInterval, input.checkInterval);
            assert.equal(defaults.useJQuery, input.useJQuery);
            assert.equal(defaults.verbose, input.verbose);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

      });

      describe("timeout option", function () {

        it("should accept scalar and apply globally", function (done) {
          let count = 0;
          const theTimeout = 500;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            timeout: theTimeout
          }),
          function (input) {
            assert.equal(theTimeout, input.timeout);
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        // requires source to contain specific urls
        it("should accept function and apply per url", function (done) {
          const globalTimeouts = {
            "/": 1,
            "/contact": 2,
            "/services/carpets": 3
          };
          const localTimeouts = {
            "http://northstar.local": 1,
            "http://northstar.local/contact": 2,
            "http://northstar.local/services/carpets": 3
          };
          const timeouts = globalUrl ? globalTimeouts : localTimeouts;

          const timeoutFn = function (url) {
            return timeouts[url];
          };

          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            timeout: timeoutFn
          }),
          function (input) {
            const testTimeout =
                timeouts[input.__page] ? timeouts[input.__page] : base.defaults({}).timeout;

            assert.equal(input.timeout, testTimeout,
              input.__page+":\ninput.timeout: "+input.timeout+" != testTimeout: "+testTimeout);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept object and apply per url", function (done) {
          const globalTimeouts = {
            "/": 1,
            "/contact": 2,
            "/services/carpets": 3,
            "__default": 4
          };
          const localTimeouts = {
            "http://northstar.local": 470,
            "http://northstar.local/contact": 480,
            "http://northstar.local/services/carpets": 490,
            "__default": 500
          };
          const timeouts = globalUrl ? globalTimeouts : localTimeouts;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            timeout: timeouts
          }),
          function (input) {
            const testTimeout =
                timeouts[input.__page] ? timeouts[input.__page] : timeouts.__default;

            assert.equal(input.timeout, testTimeout,
              input.__page+":\ninput.timeout: "+input.timeout+" != testTimeout: "+testTimeout);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept object and apply per url, with missing __default",
        function (done) {
          const globalTimeouts = {
            "/": 1,
            "/contact": 2,
            "/services/carpets": 3
          };
          const localTimeouts = {
            "http://northstar.local": 1,
            "http://northstar.local/contact": 2,
            "http://northstar.local/services/carpets": 3
          };
          const timeouts = globalUrl ? globalTimeouts : localTimeouts;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            timeout: timeouts
          }),
          function (input) {
            const testTimeout =
                timeouts[input.__page] ? timeouts[input.__page] : base.defaults({}).timeout;

            assert.equal(input.timeout, testTimeout,
              input.__page+":\ninput.timeout: "+input.timeout+" != testTimeout: "+testTimeout);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            })
        });

      });

      describe("selector option", function () {

        it("should accept scalar and apply globally", function (done) {
          const selector = "foo";
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            selector: selector
          }),
          function (input) {
            assert.equal(input.selector, selector);
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        // requires source to contain specific urls
        it("should accept function and apply per url", function (done) {
          const globalSelectors = {
            "/": "1",
            "/contact": "2",
            "/services/carpets": "3"
          };
          const localSelectors = {
            "http://northstar.local/": "1",
            "http://northstar.local/contact": "2",
            "http://northstar.local/services/carpets": "3"
          };
          const selectors = globalUrl ? globalSelectors : localSelectors;
          const selectorFn = function (url) {
            return selectors[url];
          };
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            selector: selectorFn
          }),
          function (input) {
            const testSelector =
                selectors[input.__page] ? selectors[input.__page] : base.defaults({}).selector;

            assert.equal(input.selector, testSelector,
              input.__page+":\ninput.selector: "+input.selector+" != testSelector: "+testSelector);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept object and apply per url", function (done) {
          const globalSelectors = {
            "/": "1",
            "/contact": "2",
            "/services/carpets": "3",
            "__default": "50"
          };
          const localSelectors = {
            "http://northstar.local/": "1",
            "http://northstar.local/contact": "2",
            "http://northstar.local/services/carpets": "3",
            "__default": "50"
          };
          const selectors = globalUrl ? globalSelectors : localSelectors;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            selector: selectors
          }),
          function (input) {
            const testSelector =
              selectors[input.__page] ? selectors[input.__page] : selectors.__default;

            assert.equal(input.selector, testSelector,
              input.__page+":\ninput.selector: "+input.selector+" != testSelector: "+testSelector);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

      });

      describe("useJQuery option", function () {

        it("should accept a scalar and apply globally",
        function (done) {
          const useJQuery = true;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            useJQuery: useJQuery
          }), function (input) {
              assert.equal(input.useJQuery, useJQuery);
              count++;
              if (count === urls) {
                done();
              }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept an object and apply per url", function (done) {
          const globalOptions = {
            "/": false,
            "/contact": true,
            "/services/carpets": false,
            "__default": true
          };
          const localOptions = {
            "http://northstar.local/": false,
            "http://northstar.local/contact": true,
            "http://northstar.local/services/carpets": false,
            "__default": true
          };
          const opts = globalUrl ? globalOptions : localOptions;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            useJQuery: opts
          }), function (input) {
            const testOption = opts[input.__page] !== void 0 ? opts[input.__page] : opts.__default;

            assert.equal(input.useJQuery, testOption,
              input.__page+":\ninput.useJQuery: "+input.useJQuery+" != testUseJQuery: "+testOption);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept a function and apply per url", function (done) {
          const globalOptions = {
            "/": false,
            "/contact": true,
            "/services/carpets": false
          };
          const localOptions = {
            "http://northstar.local/": false,
            "http://northstar.local/contact": true,
            "http://northstar.local/services/carpets": false
          };
          let count = 0;
          const opts = globalUrl ? globalOptions : localOptions;
          const useJQFn = function (url) {
            return opts[url];
          };

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            useJQuery: useJQFn
          }), function (input) {
            const testOption = opts[input.__page] ? opts[input.__page] : base.defaults({}).useJQuery;

            assert.equal(input.useJQuery, testOption,
              input.__page+":\ninput.useJQuery: "+input.useJQuery+" != testUseJQuery: "+testOption);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

      });

      describe("verbose option", function () {

        it("should accept a scalar and apply globally",
        function (done) {
          const verbose = true;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            verbose: verbose
          }), function (input) {
              assert.equal(input.verbose, verbose);
              count++;
              if (count === urls) {
                done();
              }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept an object and apply per url", function (done) {
          const globalOptions = {
            "/": false,
            "/contact": true,
            "/services/carpets": false,
            "__default": true
          };
          const localOptions = {
            "http://northstar.local/": false,
            "http://northstar.local/contact": true,
            "http://northstar.local/services/carpets": false,
            "__default": true
          };
          const opts = globalUrl ? globalOptions : localOptions;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            verbose: opts
          }), function (input) {
            const testOption = opts[input.__page] !== void 0 ? opts[input.__page] : opts.__default;

            assert.equal(input.verbose, testOption,
              input.__page+":\ninput.verbose: "+input.verbose+" != testVerbose: "+testOption);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept a function and apply per url", function (done) {
          const globalOptions = {
            "/": false,
            "/contact": true,
            "/services/carpets": false
          };
          const localOptions = {
            "http://northstar.local/": false,
            "http://northstar.local/contact": true,
            "http://northstar.local/services/carpets": false
          };
          let count = 0;
          const opts = globalUrl ? globalOptions : localOptions;
          const useVerboseFn = function (url) {
            return opts[url];
          };

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            verbose: useVerboseFn
          }), function (input) {
            const testOption = opts[input.__page] ? opts[input.__page] : base.defaults({}).verbose;

            assert.equal(input.verbose, testOption,
              input.__page+":\ninput.verbose: "+input.verbose+" != testUseVerbose: "+testOption);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

      });

      describe("phantomjsOptions option", function () {

        it("should accept a single string and apply globally", function (done) {
          const phantomjsOption = "--version";
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            phantomjsOptions: phantomjsOption
          }), function (input) {

              assert.equal(input.phantomjsOptions, phantomjsOption,
                input.__page+":\ninput.phantomjsOptions should be equal to the original input");

              count++;
              if (count === urls) {
                done();
              }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept a single array and apply globally", function (done) {
          const phantomjsOption = ["--version", "--help"];
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            phantomjsOptions: phantomjsOption
          }), function (input) {

              assert.equal(typeof input.phantomjsOptions, typeof phantomjsOption,
                input.__page+":\ninput.phantomjsOptions should be an array:\n"+
                require("util").inspect(input.phantomjsOptions));

              assert.deepEqual(input.phantomjsOptions, phantomjsOption,
                input.__page+":\ninput.phantomjsOptions should be equal to the original input");

              count++;
              if (count === urls) {
                done();
              }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept an object and apply per url", function (done) {
          const phantomjsOption1 = "--version",
              phantomjsOption2 = ["--help"],
              phantomjsOption3 = ["--another-option=somevalue", "--some-other-option=someother"];

          const globalOptions = {
            "/": phantomjsOption1,
            "/contact": phantomjsOption2,
            "/services/carpets": phantomjsOption3,
            "__default": ""
          };
          const localOptions = {
            "http://northstar.local/": phantomjsOption1,
            "http://northstar.local/contact": phantomjsOption2,
            "http://northstar.local/services/carpets": phantomjsOption3,
            "__default": ""
          };
          const opts = globalUrl ? globalOptions : localOptions;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            phantomjsOptions: opts
          }), function (input) {
            const testOption = opts[input.__page] !== void 0 ? opts[input.__page] : opts.__default;

            assert.deepEqual(input.phantomjsOptions, testOption,
              input.__page+":\ninput.phantomjsOptions: "+input.phantomjsOptions+" != testPhantomJSOption: "+testOption);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should accept a function and apply per url", function (done) {
          const phantomjsOption1 = "--version",
              phantomjsOption2 = ["--help"],
              phantomjsOption3 = ["--another-option=somevalue", "--some-other-option=someother"];

          const globalOptions = {
            "/": phantomjsOption1,
            "/contact": phantomjsOption2,
            "/services/carpets": phantomjsOption3
          };
          const localOptions = {
            "http://northstar.local/": phantomjsOption1,
            "http://northstar.local/contact": phantomjsOption2,
            "http://northstar.local/services/carpets": phantomjsOption3
          };
          const opts = globalUrl ? globalOptions : localOptions;
          let count = 0;
          const phantomjsFn = function (url) {
            return opts[url];
          };

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            phantomjsOptions: phantomjsFn
          }), function (input) {
            const testOption = opts[input.__page] ? opts[input.__page] : base.defaults({}).phantomjsOptions;

            assert.deepEqual(input.phantomjsOptions, testOption,
              input.__page+":\ninput.phantomjsOptions: "+input.phantomjsOptions+" != testPhantomJSOption: "+testOption);

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

      });

      describe("url behavior", function () {

        it("should replace the default hostname in results", function (done) {
          const hostname = "foo";
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            hostname: hostname
          }),
          function (input) {
            const re = new RegExp(`http://(${hostname})/`);
            const match = re.exec(input.url);
            if (globalUrl) {
              assert.equal(match[1], hostname);
            } else {
              assert.equal(match === null, true);
            }
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should replace the default protocol in results", function (done) {
          const proto = "file";
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            protocol: proto
          }),
          function (input) {
            const re = new RegExp(`^(${proto})://`);
            const match = re.exec(input.url);
            if (globalUrl) {
              assert.equal(match[1], proto);
            } else {
              assert.equal(match === null, true);
            }
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should contain a port in the url if one is specified",
        function (done) {
          const port = 8080;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            port: port
          }),
          function (input) {
            const re = new RegExp(`^http://localhost\\:(${port})/`);
            const match = re.exec(input.url);
            if (globalUrl) {
              assert.equal(match[1], port);
            } else {
              assert.equal(match === null, true);
            }
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should contain an auth in the url if one is specified",
        function (done) {
          const auth = "user:pass";
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            auth: auth
          }),
          function (input) {
            const re = new RegExp(`^http://(${auth})@localhost/`);
            const match = re.exec(input.url);
            if (globalUrl) {
              assert.equal(match[1], auth);
            } else {
              assert.equal(match === null, true);
            }
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        if (remote) {
          remote.forEach(remoteUrl => {
            it(`should process remote source url ${remoteUrl}`, function (done) {
              this.timeout(5000);
              let count = 0;

              const result = gen.run(options.decorate({
                source: remoteUrl,
                outputDir: thisOutputDir,
                _abort: function (err) {
                  assert.fail(`${remoteUrl} should not have aborted: ${err.toString()}`);
                }
              }), function (input) {
                assert(true, common.isUrl(input.url));
                count++;
                if (count === urls) {
                  done();
                }
              });

              result
                .then(function () {
                  assert.ok(true);
                })
                .catch(function (err) {
                  assert.fail(`Run should not fail: ${err.toString()}`);
                });
            });
          });
        }

        if (bad) {
          bad.forEach(badSource => {
            it(`should handle bad source ${badSource}`, function (done) {
              this.timeout(10000);
              gen.run(options.decorate({
                source: badSource,
                outputDir: thisOutputDir,
                _abort: function (err) {
                  // console.log(`@@@ ${badSource} should have aborted with error`);
                  assert.equal(true, !!err, `${badSource} should have aborted with error`);
                  done();
                }
              }), function () {
                //console.log("@@@ bad input:\n"+require("util").inspect(input));
                assert.fail(`Input handler was called unexpectedly for badSource: ${badSource}`);
                done(true);
              });
            });
          });
        }
      });

      describe("checkInterval option", function () {

        it("should replace the default checkInterval globally", function (done) {
          const checkInterval = 1;
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            checkInterval: checkInterval
          }), function (input) {
            assert.equal(input.checkInterval, checkInterval);
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

      });

      describe("output file behavior", function () {

        it("should contain the snapshot directory in output outfile spec",
        function (done) {
          const snapshotDir = "foo";
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: path.join(thisOutputDir, snapshotDir)
          }), function (input) {
            const re = new RegExp("\\"+path.sep+"("+snapshotDir+")"+"\\"+path.sep);
            const match = re.exec(input.outputFile);
            assert.equal(match[1], snapshotDir);
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        // requires inputFile to contain specific urls
        it("should contain the page structure in the output file spec",
        function (done) {
          const snapshotDir = "foo";
          const pages = !globalUrl ? {
            "http://northstar.local/": "/",
            "http://northstar.local/contact": "/contact",
            "http://northstar.local/services/carpets": "/services/carpets",
            "http://northstar.local/services/test?arg=one": "/services/test",
            "https://northstar.local/services/#hash": "/services"
          } : {
            "/": "/",
            "/contact": "/contact",
            "/services/carpets": "/services/carpets",
            "/services/test?arg=one": "/services/test",
            "/services/#hash": "/services"
          };
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: path.join(thisOutputDir, snapshotDir)
          }), function (input) {
            const re = new RegExp("("+snapshotDir+")("+urlToPathRe(pages[input.__page])+")");
            const match = re.exec(input.outputFile);

            assert.equal(true, match[1] === snapshotDir && match[2] === urlToPath(pages[input.__page]));

            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

      });

      describe("outputPath option", function () {
        it("should lookup an outputPath (per page from a function) if one is specified",
        function (done) {
          const argOne = "/services/test/arg/one";
          const hash = "/services/hash";
          const pages = !globalUrl ? {
            "http://northstar.local/": "/",
            "http://northstar.local/contact": "/contact",
            "http://northstar.local/services/carpets": "/services/carpets",
            "http://northstar.local/services/test?arg=one": argOne,
            "https://northstar.local/services/#hash": hash
          } : {
            "/": "/",
            "/contact": "/contact",
            "/services/carpets": "/services/carpets",
            "/services/test?arg=one": argOne,
            "/services/#hash": hash
          };
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputPath: function (p) {
              return pages[p];
            },
            outputDir: thisOutputDir
          }), function (input) {
            const re = new RegExp("("+urlToPathRe(pages[input.__page])+")");
            const match = re.exec(input.outputFile);
            assert.equal(match[1], urlToPath(pages[input.__page]));
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should lookup an outputPath (from a hash) and find it in the outputFile spec",
        function (done) {
          const argOne = "/services/test/arg/one";
          const hash = "/services/hash";
          const outputPath = !globalUrl ? {
            "http://northstar.local/services/test?arg=one": argOne,
            "https://northstar.local/services/#hash": hash
          } : { "/services/test?arg=one": argOne, "/services/#hash": hash };
          const pages = !globalUrl ? {
            "http://northstar.local/": "/",
            "http://northstar.local/contact": "/contact",
            "http://northstar.local/services/carpets": "/services/carpets",
            "http://northstar.local/services/test?arg=one": argOne,
            "https://northstar.local/services/#hash": hash
          } : {
            "/": "/",
            "/contact": "/contact",
            "/services/carpets": "/services/carpets",
            "/services/test?arg=one": argOne,
            "/services/#hash": hash
          };
          let count = 0;

          const result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            outputPath: outputPath
          }), function (input) {
            const re = new RegExp("("+urlToPathRe(pages[input.__page])+")");
            const match = re.exec(input.outputFile);
            assert.equal(match[1], urlToPath(pages[input.__page]));
            count++;
            if (count === urls) {
              done();
            }
          });

          result
            .then(function () {
              assert.ok(true);
            })
            .catch(function (err) {
              assert.fail(`Run should not fail: ${err.toString()}`);
            });
        });

        it("should return false if a snapshot can't be created",
        function (done) {
          let aborted = false;
          let count = 0;
          const argOne = "/services/test/arg/one";
          const hash = "/services/hash";
          const pages = !globalUrl ? {
              // this causes the problem
              //"http://northstar.local/": "/",
              "http://northstar.local/contact": "/contact",
              "http://northstar.local/services/carpets": "/services/carpets",
              "http://northstar.local/services/test?arg=one": argOne,
              "https://northstar.local/services/#hash": hash
          } : {
            // this causes the problem
            //"/": "/",
            "/contact": "/contact",
            "/services/carpets": "/services/carpets",
            "/services/test?arg=one": argOne,
            "/services/#hash": hash
          };

          gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            _abort: function (err) {
              assert.equal(!!err, true);
              aborted = true;
              done();
            },
            outputPath: function (p) {
              return pages[p];
            }
          }), function (input) {
            if (!aborted) {
              const re = new RegExp("("+urlToPathRe(pages[input.__page])+")");
              const match = re.exec(input.outputFile);
              assert.equal(match[1], urlToPath(pages[input.__page]));
              count++;
              if (count === (urls-1)) {
                done();
              }
            }
          });

          // for sitemap-gzip, result is true because it doesn't know yet
          //assert.equal(false, result);
        });

      });

    });
  });

});
