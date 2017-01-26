/* global describe, it, before */
var assert = require("assert");
var path = require("path");
var base = require("../../../lib/input-generators/_base");
var factory = require("../../../lib/input-generators");
var common = require("../../../lib/common");
var server = require("../../server");
var options = require("../../helpers/options");
var port = 8033;

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

  var thisOutputDir = path.join(__dirname, "snapshots");

  var inputGenerators = [
    {
      name: "robots",
      input: factory.create("robots"),
      source: path.join(__dirname, "test_robots.txt"),
      remote: "http://localhost:"+port+"/test_robots.txt",
      bad: [
        path.join(__dirname, "test_robots_bad.txt"),
        "http://localhost:"+port+"/test_robots_bad.txt"
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
      remote: "http://localhost:"+port+"/test_sitemap.xml",
      urls: 5
    },
    {
      name: "sitemap-gzip",
      input: factory.create("sitemap"),
      source: path.join(__dirname, "test_sitemap.xml.gz"),
      remote: "http://localhost:"+port+"/test_sitemap.xml.gz",
      bad: [
        path.join(__dirname, "test_sitemap_bad.xml.gz"),
        "http://localhost:"+port+"/test_sitemap_bad.xml.gz"
      ],
      urls: 5
    },
    {
      name: "sitemap-index",
      input: factory.create("sitemap-index"),
      source: path.join(__dirname, "test_sitemap_index.xml"),
      remote: "http://localhost:"+port+"/test_sitemap_index.xml",
      // this is the total number of pages referenced by sitemaps in test_sitemap_index.
      urls: 17
    },
    {
      name: "sitemap-index-gzip",
      input: factory.create("sitemap-index"),
      source: path.join(__dirname, "test_sitemap_index.xml.gz"),
      remote: "http://localhost:"+port+"/test_sitemap_index.xml.gz",
      // this is the total number of pages referenced by sitemaps in test_sitemap_index.
      urls: 17
    }
  ];

  /**
   * Escape a string for usage in a regular expression.
   */
  function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  function pathToRe (component) {
    return regexEscape(component);
  }

  function urlToPath (url) {
    var result = url;
    if (process.platform === "win32") {
      result = url.replace(/\//g, "\\");
    }
    return result;
  }

  function urlToPathRe (url) {
    var result = url;
    if (process.platform === "win32") {
      result = url.replace(/\//g, "\\\\");
    }
    return result;
  }

  inputGenerators.forEach(function (inputGeneratorTest) {

    describe(inputGeneratorTest.name, function () {

      var globalUrl = inputGeneratorTest.name === "robots" || inputGeneratorTest.name === "textfile";
      // var genName = inputGeneratorTest.name;
      var remote = inputGeneratorTest.remote;
      var gen = inputGeneratorTest.input;
      var source = inputGeneratorTest.source;
      var bad = inputGeneratorTest.bad;
      var urls = inputGeneratorTest.urls;

      describe("general behavior", function () {

        it("should return false for null", function () {
          assert.equal(false, factory.isNull(gen));
        });

        it("should have a run method", function (){
          assert.equal(true, typeof gen.run === 'function');
        });

        // requires inputFile not found
        it("should produce no input for defaults and a bogus file", function (done) {
          var doneCalled = false;

          gen.run(options.decorate({
            source: "./bogus/file.txt",
            outputDir: thisOutputDir,
            _abort: function(err) {
              assert.equal(true, !!err);
              doneCalled = true;
              done();
            }
          }), function () {
            assert.fail("input callback", "called", "unexpected input processed", "should not have been");
          });

          setTimeout(function () {
            if (!doneCalled) {
              done("abort was not called as expected");
            }
          }, 200);
        });

        // requires source to have 'urls' valid entries
        it("should produce input with all defaults and a valid source", function (done) {
          var count = 0;

          var result = gen.run(options.decorate({
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        // this test has to match the base generator defaults
        it("base defaults should exist in input when requested", function (done) {
          var defaults = base.defaults({});
          defaults.outputDir = thisOutputDir;

          var count = 0;
          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir
          }), function (input) {
            var re1 = new RegExp("^("+defaults.protocol+")://("+defaults.hostname+")/");
            var re2 = new RegExp("^("+pathToRe(defaults.outputDir)+")"+pathToRe(path.sep));

            var m1 = re1.exec(input.url);
            var m2 = re2.exec(input.outputFile);

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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

      });

      describe("timeout option", function () {

        it("should accept scalar and apply globally", function (done) {
          var count = 0;
          var theTimeout = 500;

          var result = gen.run(options.decorate({
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        // requires source to contain specific urls
        it("should accept function and apply per url", function (done) {
          var globalTimeouts = {
            "/": 1,
            "/contact": 2,
            "/services/carpets": 3
          };
          var localTimeouts = {
            "http://northstar.local": 1,
            "http://northstar.local/contact": 2,
            "http://northstar.local/services/carpets": 3
          };
          var timeouts = globalUrl ? globalTimeouts : localTimeouts;

          var timeoutFn = function (url) {
            return timeouts[url];
          };

          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            timeout: timeoutFn
          }),
          function (input) {
            var testTimeout =
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept object and apply per url", function (done) {
          var globalTimeouts = {
            "/": 1,
            "/contact": 2,
            "/services/carpets": 3,
            "__default": 4
          };
          var localTimeouts = {
            "http://northstar.local": 470,
            "http://northstar.local/contact": 480,
            "http://northstar.local/services/carpets": 490,
            "__default": 500
          };
          var timeouts = globalUrl ? globalTimeouts : localTimeouts;
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            timeout: timeouts
          }),
          function (input) {
            var testTimeout =
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept object and apply per url, with missing __default",
        function (done) {
          var globalTimeouts = {
            "/": 1,
            "/contact": 2,
            "/services/carpets": 3
          };
          var localTimeouts = {
            "http://northstar.local": 1,
            "http://northstar.local/contact": 2,
            "http://northstar.local/services/carpets": 3
          };
          var timeouts = globalUrl ? globalTimeouts : localTimeouts;
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            timeout: timeouts
          }),
          function (input) {
            var testTimeout =
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
              assert.fail("run", "fail", err.toString(), "should not");
            })
        });

      });

      describe("selector option", function () {

        it("should accept scalar and apply globally", function (done) {
          var selector = "foo";
          var count = 0;

          var result = gen.run(options.decorate({
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        // requires source to contain specific urls
        it("should accept function and apply per url", function (done) {
          var globalSelectors = {
            "/": "1",
            "/contact": "2",
            "/services/carpets": "3"
          };
          var localSelectors = {
            "http://northstar.local/": "1",
            "http://northstar.local/contact": "2",
            "http://northstar.local/services/carpets": "3"
          };
          var selectors = globalUrl ? globalSelectors : localSelectors;
          var selectorFn = function (url) {
            return selectors[url];
          };
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            selector: selectorFn
          }),
          function (input) {
            var testSelector =
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept object and apply per url", function (done) {
          var globalSelectors = {
            "/": "1",
            "/contact": "2",
            "/services/carpets": "3",
            "__default": "50"
          };
          var localSelectors = {
            "http://northstar.local/": "1",
            "http://northstar.local/contact": "2",
            "http://northstar.local/services/carpets": "3",
            "__default": "50"
          };
          var selectors = globalUrl ? globalSelectors : localSelectors;
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            selector: selectors
          }),
          function (input) {
            var testSelector =
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

      });

      describe("useJQuery option", function () {

        it("should accept a scalar and apply globally",
        function (done) {
          var useJQuery = true;
          var count = 0;

          var result = gen.run(options.decorate({
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept an object and apply per url", function (done) {
          var globalOptions = {
            "/": false,
            "/contact": true,
            "/services/carpets": false,
            "__default": true
          };
          var localOptions = {
            "http://northstar.local/": false,
            "http://northstar.local/contact": true,
            "http://northstar.local/services/carpets": false,
            "__default": true
          };
          var opts = globalUrl ? globalOptions : localOptions;
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            useJQuery: opts
          }), function (input) {
            var testOption = opts[input.__page] !== void 0 ? opts[input.__page] : opts.__default;

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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept a function and apply per url", function (done) {
          var globalOptions = {
            "/": false,
            "/contact": true,
            "/services/carpets": false
          };
          var localOptions = {
            "http://northstar.local/": false,
            "http://northstar.local/contact": true,
            "http://northstar.local/services/carpets": false
          };
          var count = 0;
          var opts = globalUrl ? globalOptions : localOptions;
          var useJQFn = function (url) {
            return opts[url];
          };

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            useJQuery: useJQFn
          }), function (input) {
            var testOption = opts[input.__page] ? opts[input.__page] : base.defaults({}).useJQuery;

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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

      });

      describe("verbose option", function () {

        it("should accept a scalar and apply globally",
        function (done) {
          var verbose = true;
          var count = 0;

          var result = gen.run(options.decorate({
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept an object and apply per url", function (done) {
          var globalOptions = {
            "/": false,
            "/contact": true,
            "/services/carpets": false,
            "__default": true
          };
          var localOptions = {
            "http://northstar.local/": false,
            "http://northstar.local/contact": true,
            "http://northstar.local/services/carpets": false,
            "__default": true
          };
          var opts = globalUrl ? globalOptions : localOptions;
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            verbose: opts
          }), function (input) {
            var testOption = opts[input.__page] !== void 0 ? opts[input.__page] : opts.__default;

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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept a function and apply per url", function (done) {
          var globalOptions = {
            "/": false,
            "/contact": true,
            "/services/carpets": false
          };
          var localOptions = {
            "http://northstar.local/": false,
            "http://northstar.local/contact": true,
            "http://northstar.local/services/carpets": false
          };
          var count = 0;
          var opts = globalUrl ? globalOptions : localOptions;
          var useVerboseFn = function (url) {
            return opts[url];
          };

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            verbose: useVerboseFn
          }), function (input) {
            var testOption = opts[input.__page] ? opts[input.__page] : base.defaults({}).verbose;

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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

      });

      describe("phantomjsOptions option", function () {

        it("should accept a single string and apply globally", function (done) {
          var phantomjsOption = "--version";
          var count = 0;

          var result = gen.run(options.decorate({
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept a single array and apply globally", function (done) {
          var phantomjsOption = ["--version", "--help"];
          var count = 0;

          var result = gen.run(options.decorate({
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept an object and apply per url", function (done) {
          var phantomjsOption1 = "--version",
              phantomjsOption2 = ["--help"],
              phantomjsOption3 = ["--another-option=somevalue", "--some-other-option=someother"];

          var globalOptions = {
            "/": phantomjsOption1,
            "/contact": phantomjsOption2,
            "/services/carpets": phantomjsOption3,
            "__default": ""
          };
          var localOptions = {
            "http://northstar.local/": phantomjsOption1,
            "http://northstar.local/contact": phantomjsOption2,
            "http://northstar.local/services/carpets": phantomjsOption3,
            "__default": ""
          };
          var opts = globalUrl ? globalOptions : localOptions;
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            phantomjsOptions: opts
          }), function (input) {
            var testOption = opts[input.__page] !== void 0 ? opts[input.__page] : opts.__default;

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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should accept a function and apply per url", function (done) {
          var phantomjsOption1 = "--version",
              phantomjsOption2 = ["--help"],
              phantomjsOption3 = ["--another-option=somevalue", "--some-other-option=someother"];

          var globalOptions = {
            "/": phantomjsOption1,
            "/contact": phantomjsOption2,
            "/services/carpets": phantomjsOption3
          };
          var localOptions = {
            "http://northstar.local/": phantomjsOption1,
            "http://northstar.local/contact": phantomjsOption2,
            "http://northstar.local/services/carpets": phantomjsOption3
          };
          var opts = globalUrl ? globalOptions : localOptions;
          var count = 0;
          var phantomjsFn = function (url) {
            return opts[url];
          };

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            phantomjsOptions: phantomjsFn
          }), function (input) {
            var testOption = opts[input.__page] ? opts[input.__page] : base.defaults({}).phantomjsOptions;

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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

      });

      describe("url behavior", function () {

        it("should replace the default hostname in results", function (done) {
          var hostname = "foo";
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            hostname: hostname
          }),
          function (input) {
            var re = new RegExp("http://("+hostname+")/");
            var match = re.exec(input.url);
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should replace the default protocol in results", function (done) {
          var proto = "file";
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            protocol: proto
          }),
          function (input) {
            var re = new RegExp("^("+proto+")://");
            var match = re.exec(input.url);
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should contain a port in the url if one is specified",
        function (done) {
          var port = 8080;
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            port: port
          }),
          function (input) {
            var re = new RegExp("^http://localhost\\:("+port+")/");
            var match = re.exec(input.url);
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should contain an auth in the url if one is specified",
        function (done) {
          var auth = "user:pass";
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            auth: auth
          }),
          function (input) {
            var re = new RegExp("^http://("+auth+")@localhost/");
            var match = re.exec(input.url);
            if (globalUrl) {
              assert.equal(match[1], auth);
            } else {
              assert.equal(match ===null, true);
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        if (remote) {
          it("should process remote source urls", function (done) {
            var count = 0;

            var result = gen.run(options.decorate({
              source: remote,
              outputDir: thisOutputDir,
              _abort: function (err) {
                assert.fail(false, !!err, remote + " should not have aborted: " + err.toString(), ",");
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
                assert.fail("run", "fail", err.toString(), "should not");
              });
          });
        }

        if (bad) {
          bad.forEach(function (badSource) {
            it("should handle bad source "+badSource, function (done) {
              gen.run(options.decorate({
                source: badSource,
                outputDir: thisOutputDir,
                _abort: function (err) {
                  assert.equal(true, !!err, badSource + " should have aborted with error");
                  done();
                }
              }), function () {
                //console.log("@@@ bad input:\n"+require("util").inspect(input));
                assert.fail(false, true, " input handler was called unexpectedly for badSource "+badSource, ",");
                done(true);
              });
            });
          });
        }
      });

      describe("checkInterval option", function () {

        it("should replace the default checkInterval globally", function (done) {
          var checkInterval = 1;
          var count = 0;

          var result = gen.run(options.decorate({
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

      });

      describe("output file behavior", function () {

        it("should contain the snapshot directory in output outfile spec",
        function (done) {
          var snapshotDir = "foo";
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: path.join(thisOutputDir, snapshotDir)
          }), function (input) {
            var re = new RegExp("\\"+path.sep+"("+snapshotDir+")"+"\\"+path.sep);
            var match = re.exec(input.outputFile);
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        // requires inputFile to contain specific urls
        it("should contain the page structure in the output file spec",
        function (done) {
          var snapshotDir = "foo";
          var pages = {
            "/": "/",
            "/contact": "/contact",
            "/services/carpets": "/services/carpets",
            "/services/test?arg=one": "/services/test",
            "/services/#hash": "/services"
          };
          if (!globalUrl) {
            pages = {
              "http://northstar.local/": "/",
              "http://northstar.local/contact": "/contact",
              "http://northstar.local/services/carpets": "/services/carpets",
              "http://northstar.local/services/test?arg=one": "/services/test",
              "https://northstar.local/services/#hash": "/services"
            };
          }
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: path.join(thisOutputDir, snapshotDir)
          }), function (input) {
            var re = new RegExp("("+snapshotDir+")("+urlToPathRe(pages[input.__page])+")");
            var match = re.exec(input.outputFile);

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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

      });

      describe("outputPath option", function () {
        it("should lookup an outputPath (per page from a function) if one is specified",
        function (done) {
          var argOne = "/services/test/arg/one";
          var hash = "/services/hash";
          var pages = {
            "/": "/",
            "/contact": "/contact",
            "/services/carpets": "/services/carpets",
            "/services/test?arg=one": argOne,
            "/services/#hash": hash
          };
          if (!globalUrl) {
            pages = {
              "http://northstar.local/": "/",
              "http://northstar.local/contact": "/contact",
              "http://northstar.local/services/carpets": "/services/carpets",
              "http://northstar.local/services/test?arg=one": argOne,
              "https://northstar.local/services/#hash": hash
            };
          }
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputPath: function (p) {
              return pages[p];
            },
            outputDir: thisOutputDir
          }), function (input) {
            var re = new RegExp("("+urlToPathRe(pages[input.__page])+")");
            var match = re.exec(input.outputFile);
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should lookup an outputPath (from a hash) and find it in the outputFile spec",
        function (done) {
          var argOne = "/services/test/arg/one";
          var hash = "/services/hash";
          var outputPath = { "/services/test?arg=one": argOne, "/services/#hash": hash };
          var pages = {
            "/": "/",
            "/contact": "/contact",
            "/services/carpets": "/services/carpets",
            "/services/test?arg=one": argOne,
            "/services/#hash": hash
          };
          if (!globalUrl) {
            outputPath = {
              "http://northstar.local/services/test?arg=one": argOne,
              "https://northstar.local/services/#hash": hash
            };
            pages = {
              "http://northstar.local/": "/",
              "http://northstar.local/contact": "/contact",
              "http://northstar.local/services/carpets": "/services/carpets",
              "http://northstar.local/services/test?arg=one": argOne,
              "https://northstar.local/services/#hash": hash
            };
          }
          var count = 0;

          var result = gen.run(options.decorate({
            source: source,
            outputDir: thisOutputDir,
            outputPath: outputPath
          }), function (input) {
            var re = new RegExp("("+urlToPathRe(pages[input.__page])+")");
            var match = re.exec(input.outputFile);
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
              assert.fail("run", "fail", err.toString(), "should not");
            });
        });

        it("should return false if a snapshot can't be created",
        function (done) {
          var aborted = false;
          var argOne = "/services/test/arg/one";
          var hash = "/services/hash";
          var pages = {
            // this causes the problem
            //"/": "/",
            "/contact": "/contact",
            "/services/carpets": "/services/carpets",
            "/services/test?arg=one": argOne,
            "/services/#hash": hash
          };
          if (!globalUrl) {
            pages = {
              // this causes the problem
              //"http://northstar.local/": "/",
              "http://northstar.local/contact": "/contact",
              "http://northstar.local/services/carpets": "/services/carpets",
              "http://northstar.local/services/test?arg=one": argOne,
              "https://northstar.local/services/#hash": hash
            };
          }
          var count = 0;

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
              var re = new RegExp("("+urlToPathRe(pages[input.__page])+")");
              var match = re.exec(input.outputFile);
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
