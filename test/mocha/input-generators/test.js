var assert = require("assert");
var path = require("path");
var factory = require("../../../lib/input-generators");
var common = require("../../../lib/common");
var server = require("../../server");
var options = require("../../helpers/options");
var port = 8033;

describe("input-generator", function(){

  describe("null", function(){
    it("'index' should return a null generator", function(){
      assert.equal(true, factory.isNull(factory.create("index")));
    });

    it("'_common' should return a null generator", function(){
      assert.equal(true, factory.isNull(factory.create("_common")));
    });

    it("'_any' should return a null generator", function(){
      assert.equal(true, factory.isNull(factory.create("_any")));
    });

    it("'notvalid' should return a null generator", function(){
      assert.equal(true, factory.isNull(factory.create("notvalid")));
    });

    it("no input should return a null generator", function(){
      assert.equal(true, factory.isNull(factory.create()));
    });

    it("should have a run method", function(){
      assert.equal(true, typeof factory.create().run === 'function');
    });

    it("run method should return an empty array", function(){
      assert.equal(true, factory.create().run().length === 0);
    });
  });

  server.start(path.join(__dirname, "./server"), port);

  var urls = 5; // dependent on how many urls are in the test files    
  var inputGenerators = [
    {
      name: "robots",
      input: factory.create("robots"),
      source: path.join(__dirname, "test_robots.txt"),
      remote: "http://localhost:"+port+"/test_robots.txt"
    },
    { name: "textfile", input: factory.create("textfile"), source: path.join(__dirname, "test_line.txt") },
    { name: "array", input: factory.create("array"), source:
      // same as urls in sitemap
      [
        "http://northstar.local/",
        "http://northstar.local/contact",
        "http://northstar.local/services/carpets",
        "http://northstar.local/services/test?arg=one",
        "https://northstar.local/services/#hash"
      ]
    },
    {
      name: "sitemap",
      input: factory.create("sitemap"),
      source: path.join(__dirname, "test_sitemap.xml"),
      remote: "http://localhost:"+port+"/test_sitemap.xml"
    }
  ];

  for (var a in inputGenerators) {

    describe(inputGenerators[a].name, function() {

      var globalUrl = inputGenerators[a].name === "robots" || inputGenerators[a].name === "textfile";
      var genName = inputGenerators[a].name;
      var remote = inputGenerators[a].remote;
      var gen = inputGenerators[a].input;
      var source = inputGenerators[a].source;

      it("should return false for null", function() {
        assert.equal(false, factory.isNull(gen));
      });

      it("should have a run method", function(){
        assert.equal(true, typeof gen.run === 'function');
      });

      // requires inputFile not found
      it("should produce no input for defaults and a bogus file", function(done) {
        var result = gen.run(options.decorate({ source: "./bogus/file.txt" }), function(input){
          //console.log(input);
          assert.equal(true, false);
        });
        assert.equal(false, result);
        setTimeout(done, 500);
      });

      // requires source to have 'urls' valid entries
      it("should produce input with all defaults and a valid source", function(done) {
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source }), (function(counter) {
            return function() {
              counter.count++;
              if (counter.count===urls)
                done();
            };
          })(counter)
        );
        assert.equal(true, result);
      });

      // this test has to match the base generator defaults
      it("base defaults should exist in input when requested", function(done){
        var defaults = {
          protocol: "http",
          hostname: "localhost",
          outputDir: "snapshots",
          selector: "body",
          timeout: 5000,
          checkInterval: 250
        };
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source }), (function(counter, defaults){
            return function(input) {
              //console.log("input.url = "+input.url);
              //console.log("input.outputFile = "+input.outputFile);
              //console.log("defaults.protocol = "+defaults.protocol);
              //console.log("defaults.outputDir = "+defaults.outputDir);
              //console.log("selector = "+ input.selector);
              //console.log("timeout = "+input.timeout);
              //console.log("checkInterval = "+input.checkInterval);
              var re1 = new RegExp("^("+defaults.protocol+")://("+defaults.hostname+")/");
              var re2 = new RegExp("^("+defaults.outputDir+")/");
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
              counter.count++;
              if (counter.count===urls)
                done();
            };
          })(counter, defaults)
        );
        assert(true, result);
      });

      it("should accept scalar timeout and apply globally", function(done) {
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, timeout: 1}), (function(counter){
          return function(input) {
            assert.equal(1, input.timeout);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter));
        assert.equal(true, result);
      });

      // requires source to contain specific urls
      it("should accept function timeout and apply per url", function(done) {
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
        var timeout = (function(timeouts){
          return function(url) {
            return timeouts[url];
          };
        })(globalUrl ? globalTimeouts : localTimeouts);
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, timeout: timeout }), (function(counter, timeouts){
          return function(input) {
            var testTimeout =
                timeouts[input.__page] ? timeouts[input.__page] : undefined;
            assert.equal(input.timeout, testTimeout);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, globalUrl ? globalTimeouts : localTimeouts));
        assert.equal(result, true);
      });

      it("should accept object timeout and apply per url", function(done){
        var globalTimeouts = {
          "/": 1,
          "/contact": 2,
          "/services/carpets": 3,
          "__default": 4
        };
        var localTimeouts = {
          "http://northstar.local": 1,
          "http://northstar.local/contact": 2,
          "http://northstar.local/services/carpets": 3,
          "__default": 4
        };
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, timeout: globalUrl ? globalTimeouts : localTimeouts }),
          (function(counter, timeouts){
            return function(input) {
              var testTimeout =
                  timeouts[input.__page] ? timeouts[input.__page] : timeouts.__default;
              assert.equal(input.timeout, testTimeout);
              counter.count++;
              if (counter.count===urls)
                done();
            };
          })(counter, globalUrl ? globalTimeouts : localTimeouts));
        assert.equal(result, true);
      });

      it("should accept scalar selector and apply globally", function(done) {
        var selector = "foo";
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, selector: selector }), (function(counter, selector){
          return function(input) {
            assert.equal(input.selector, selector);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, selector));
        assert.equal(true, result);
      });

      // requires source to contain specific urls
      it("should accept function selector and apply per url", function(done) {
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
        var selector = (function(selectors){
          return function(url) {
            return selectors[url];
          };
        })(globalUrl ? globalSelectors : localSelectors);
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, selector: selector }), (function(counter, selectors){
          return function(input) {
            var testSelector =
                selectors[input.__page] ? selectors[input.__page] : undefined;
            //console.log("function - test selector = "+testSelector);
            //console.log("function - input selector = "+input.selector);
            assert.equal(input.selector, testSelector);
            counter.count++;
            //console.log("count = "+counter.count);
            if (counter.count===urls)
              done();
          };
        })(counter, globalUrl ? globalSelectors : localSelectors));
        assert.equal(true, result);
      });

      it("should accept object selector and apply per url", function(done){
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
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, selector: globalUrl ? globalSelectors : localSelectors }),
          (function(counter, selectors){
            return function(input) {
              var testSelector =
                selectors[input.__page] ? selectors[input.__page] : selectors.__default;
              assert.equal(input.selector, testSelector);
              counter.count++;
              //console.log("count = "+counter.count);
              if (counter.count===urls)
                done();
            };
          })(counter, globalUrl ? globalSelectors : localSelectors));
        assert.equal(true, result);
      });

      it("should replace the default hostname in results", function(done){
        var hostname = "foo";
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, hostname: hostname }), (function(counter, hostname, globalUrl){
          return function(input) {
            //console.log("url="+input.url);
            //console.log("in globalUrl="+globalUrl);
            var re = new RegExp("http://("+hostname+")/");
            var match = re.exec(input.url);
            if (globalUrl)
              assert.equal(match[1], hostname);
            else
              assert.equal(match === null, true);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, hostname, globalUrl));
        assert.equal(true, result);
      });

      it("should replace the default protocol in results", function(done){
        var proto = "file";
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, protocol: proto }), (function(counter, proto, globalUrl){
          return function(input) {
            var re = new RegExp("^("+proto+")://");
            var match = re.exec(input.url);
            if (globalUrl)
              assert.equal(match[1], proto);
            else
              assert.equal(match === null, true);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, proto, globalUrl));
        assert.equal(true, result);
      });

      it("should contain a port in the url if one is specified", function(done) {
        var port = 8080;
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, port: port }), (function(counter, port, globalUrl){
          return function(input) {
            var re = new RegExp("^http://localhost\\:("+port+")/");
            var match = re.exec(input.url);
            if (globalUrl)
              assert.equal(match[1], port);
            else
              assert.equal(match === null, true);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, port, globalUrl));
        assert.equal(true, result);
      });

      it("should contain an auth in the url if one is specified", function(done) {
        var auth = "user:pass";
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, auth: auth }), (function(counter, auth, globalUrl){
          return function(input) {
            var re = new RegExp("^http://("+auth+")@localhost/");
            var match = re.exec(input.url);
            if (globalUrl)
              assert.equal(match[1], auth);
            else
              assert.equal(match ===null, true);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, auth, globalUrl));
        assert.equal(true, result);
      });

      it("should replace the default checkInterval in results", function(done) {
        var checkInterval = 1;
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, checkInterval: checkInterval }), (function(counter, checkInterval){
          return function(input) {
            //console.log("checkInterval="+input.checkInterval);
            assert.equal(input.checkInterval, checkInterval);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, checkInterval));
        assert.equal(true, result);
      });

      it("should contain the snapshot directory in output outfile spec", function(done){
        var snapshotDir = "foo";
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, outputDir: snapshotDir }), (function(counter, snapshotDir){
          return function(input) {
            var re = new RegExp("^("+snapshotDir+")/");
            //console.log("dir - outputFile ="+input.outputFile);
            var match = re.exec(input.outputFile);
            assert.equal(match[1], snapshotDir);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, snapshotDir));
        assert.equal(true, result);
      });

      // requires inputFile to contain specific urls
      it("should contain the page structure in the output file spec", function(done) {
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
        var counter = { count: 0 };
        var result = gen.run(options.decorate({ source: source, outputDir: snapshotDir }), (function(counter, snapshotDir, pages){
          return function(input) {
            //console.log("page - input url = "+input.url);
            //console.log("page - test url = "+pages[input.__page]);
            //console.log("page - raw page = "+input.__page);
            //console.log("page - outputFile = "+input.outputFile);
            var re = new RegExp("^("+snapshotDir+")("+pages[input.__page]+")");
            var match = re.exec(input.outputFile);
            assert.equal(true, match[1] === snapshotDir && match[2] === pages[input.__page]);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, snapshotDir, pages));
        assert.equal(true, result);
      });

      it("should lookup an outputPath (per page from a function) if one is specified", function(done){
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
        var counter = { count: 0 };
        var result = gen.run(options.decorate({
            source: source,
            outputPath: (function(testData){
              return function(p){
                return testData[p];
              };
            })(pages)
          }), (function(counter, pages){
            return function(input) {
              //console.log("function - outputFile = "+input.outputFile);
              var re = new RegExp("("+pages[input.__page]+")");
              var match = re.exec(input.outputFile);
              assert.equal(match[1], pages[input.__page]);
              counter.count++;
              if (counter.count===urls)
                done();
            };
          })(counter, pages)
        );
        assert.equal(true, result);
      });

      it("should lookup an outputPath (from a hash) and find it in the outputFile spec", function(done){
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
        var counter = { count: 0 };
        var result = gen.run(options.decorate({
            source: source, outputPath: outputPath
          }), (function(counter, pages){
            return function(input) {
              //console.log("hash - outputFile = "+input.outputFile);
              var re = new RegExp("("+pages[input.__page]+")");
              var match = re.exec(input.outputFile);
              assert.equal(match[1], pages[input.__page]);
              counter.count++;
              if (counter.count===urls)
                done();
            };
          })(counter, pages)
        );
        assert.equal(true, result);
      });

      // unless its sitemap...
      it("should return false if a snapshot can't be created", function(done){
        // @@@ debugging
        //this.timeout(150000);

        var argOne = "/services/test/arg/one";
        var hash = "/services/hash";
        var pages = {
          //"/": "/",
          "/contact": "/contact",
          "/services/carpets": "/services/carpets",
          "/services/test?arg=one": argOne,
          "/services/#hash": hash
        };
        if (!globalUrl) {
          pages = {
            //"http://northstar.local/": "/",
            "http://northstar.local/contact": "/contact",
            "http://northstar.local/services/carpets": "/services/carpets",
            "http://northstar.local/services/test?arg=one": argOne,
            "https://northstar.local/services/#hash": hash
          };
        }
        var counter = { count: 0 };
        var result = gen.run(options.decorate({
            source: source,
            // add listener hook for sitemap
            _listener: genName === "sitemap" ? function(err) {
              assert.equal(true, !!err);
              done();
            } : null,
            outputPath: (function(testData){
              return function(p){
                return testData[p];
              };
            })(pages)
          }), (function(counter, pages){
            return function(input) {
              // this doesn't happen for sitemap
              //console.log("function - outputFile = "+input.outputFile);
              var re = new RegExp("("+pages[input.__page]+")");
              var match = re.exec(input.outputFile);
              assert.equal(match[1], pages[input.__page]);
              counter.count++;
              if (counter.count===urls-1)
                done();
            };
          })(counter, pages)
        );
        assert.equal(false, result);
      });

      if (remote) {
        it("should process remote source urls", function(done){
          // @@@ debugging
          //this.timeout(30000);

          var counter = { count: 0 };
          var result = gen.run(options.decorate({ source: remote }), function(input){
            //console.log("remote = "+input.url);
            assert(true, common.isUrl(input.url));
            counter.count++;
            if (counter.count===urls)
              done();
          });
          assert(true, result);
        });
      }

    });
  }

});