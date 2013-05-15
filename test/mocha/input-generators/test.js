var assert = require("assert");
var path = require("path");
var factory = require("../../../src/lib/input-generators");

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

  // dependent on how many urls are in the test files
  var urls = 5;
  var googleurls = 42;
  var inputGenerators = [
    { name: "robots", input: factory.create("robots"), source: path.join(__dirname, "test_robots.txt") },
    { name: "textfile", input: factory.create("textfile"), source: path.join(__dirname, "test_line.txt") },
    { name: "array", input: factory.create("array"), source:
      // same as urls in test files
      ["/", "/contact", "/services/carpets", "/services/test?arg=one", "/services/#hash"]
    }
  ];

  for (var a in inputGenerators) {

    describe(inputGenerators[a].name, function() {

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
        var result = gen.run({ source: "./bogus/file.txt" }, function(input){
          //console.log(input);
          assert.equal(true, false);
        });
        assert.equal(false, result);
        setTimeout(done, 500);
      });

      // requires source to have 'urls' valid entries
      it("should produce input with all defaults and a valid source", function(done) {
        var counter = { count: 0 };
        var result = gen.run({ source: source }, (function(counter) {
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
        var result = gen.run({ source: source }, (function(counter, defaults){
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
              assert.equal(m1[1], defaults.protocol);
              assert.equal(m1[2], defaults.hostname);
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
      });

      it("should accept scalar timeout and apply globally", function(done) {
        var counter = { count: 0 };
        var result = gen.run({ source: source, timeout: 1}, (function(counter){
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
        var timeouts = {
          "/": 1,
          "/contact": 2,
          "/services/carpets": 3
        };
        var timeout = function(url) {
          return timeouts[url];
        };
        var counter = { count: 0 };
        var result = gen.run({ source: source, timeout: timeout }, (function(counter, timeouts){
          return function(input) {
            assert.equal(input.timeout, timeouts[input.__page]);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, timeouts));
        assert.equal(result, true);
      });

      it("should accept scalar selector and apply globally", function(done) {
        var selector = "foo";
        var counter = { count: 0 };
        var result = gen.run({ source: source, selector: selector }, (function(counter, selector){
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
        var selectors = {
          "/": "1",
          "/contact": "2",
          "/services/carpets": "3"
        };
        var selector = function(url) {
          return selectors[url];
        };
        var counter = { count: 0 };
        var result = gen.run({ source: source, selector: selector }, (function(counter, selectors){
          return function(input) {
            assert.equal(input.selector, selectors[input.__page]);
            counter.count++;
            //console.log("count = "+counter.count);
            if (counter.count===urls)
              done();
          };
        })(counter, selectors));
        assert.equal(true, result);
      });

      it("should replace the default hostname in results", function(done){
        var hostname = "foo";
        var counter = { count: 0 };
        var result = gen.run({ source: source, hostname: hostname }, (function(counter, hostname){
          return function(input) {
            //console.log("url="+input.url);
            var re = new RegExp("http://("+hostname+")/");
            var match = re.exec(input.url);
            assert.equal(match[1], hostname);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, hostname));
        assert.equal(true, result);
      });

      it("should replace the default protocol in results", function(done){
        var proto = "https";
        var counter = { count: 0 };
        var result = gen.run({ source: source, protocol: proto }, (function(counter, proto){
          return function(input) {
            var re = new RegExp("^("+proto+")://");
            var match = re.exec(input.url);
            assert.equal(match[1], proto);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, proto));
        assert.equal(true, result);
      });

      it("should contain a port in the url if one is specified", function(done) {
        var port = 8080;
        var counter = { count: 0 };
        var result = gen.run({ source: source, port: port }, (function(counter, port){
          return function(input) {
            var re = new RegExp("^http://localhost\\:("+port+")/");
            var match = re.exec(input.url);
            assert.equal(match[1], port);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, port));
        assert.equal(true, result);
      });

      it("should contain an auth in the url if one is specified", function(done) {
        var auth = "user:pass";
        var counter = { count: 0 };
        var result = gen.run({ source: source, auth: auth }, (function(counter, auth){
          return function(input) {
            var re = new RegExp("^http://("+auth+")@localhost/");
            var match = re.exec(input.url);
            assert.equal(match[1], auth);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, auth));
        assert.equal(true, result);
      });

      it("should replace the default checkInterval in results", function(done) {
        var checkInterval = 1;
        var counter = { count: 0 };
        var result = gen.run({ source: source, checkInterval: checkInterval }, (function(counter, checkInterval){
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
        var result = gen.run({ source: source, outputDir: snapshotDir }, (function(counter, snapshotDir){
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
        var counter = { count: 0 };
        var result = gen.run({ source: source, outputDir: snapshotDir }, (function(counter, snapshotDir, pages){
          return function(input) {
            //console.log("input url = "+input.url);
            //console.log("test url = "+pages[input.__page);
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
        var counter = { count: 0 };
        var result = gen.run({
            source: source,
            // just override two output paths
            outputPath: (function(testData){
              return function(p){
                return testData[p];
              };
            })(pages)
          }, (function(counter, pages){
            return function(input) {
              //console.log("hash - outputFile = "+input.outputFile);
              var re = new RegExp("("+pages[input.__page]+")");
              var match = re.exec(input.outputFile);
              assert.equal(true, match[1] === pages[input.__page]);
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
        var pages = {
          "/": "/",
          "/contact": "/contact",
          "/services/carpets": "/services/carpets",
          "/services/test?arg=one": argOne,
          "/services/#hash": hash
        };
        var counter = { count: 0 };
        var result = gen.run({
            source: source,
            // just override two output paths
            outputPath: { "/services/test?arg=one": argOne, "/services/#hash": hash }
          }, (function(counter, pages){
            return function(input) {
              //console.log("hash - outputFile = "+input.outputFile);
              var re = new RegExp("("+pages[input.__page]+")");
              var match = re.exec(input.outputFile);
              assert.equal(true, match[1] === pages[input.__page]);
              counter.count++;
              if (counter.count===urls)
                done();
            };
          })(counter, pages)
        );
        assert.equal(true, result);
      });
    });

    if (inputGenerators[a].name === "robots") {
      describe ("robots", function(){        
        var gen = inputGenerators[a].input;
        var source = inputGenerators[a].source;

        it("should produce input using a remote robots.txt", function(done){
          var counter = { count: 0 };
          var result = gen.run({ source: "http://www.google.com/robots.txt", hostname: "google.com" }, (function(counter){
              return function(input) {
                //console.log("google["+counter.count+"] - url = "+input.url);
                //console.log("google["+counter.count+"] - outputFile = "+input.outputFile);
                counter.count++;
                if (counter.count === googleurls)
                  done();
              };
            })(counter)
          );
        });
      });
    }
  }
});