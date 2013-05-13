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
          "http://localhost/": 1,
          "http://localhost/contact": 2,
          "http://localhost/services/carpets": 3
        };
        var timeout = function(url) {
          return timeouts[url];
        };
        var counter = { count: 0 };
        var result = gen.run({ source: source, timeout: timeout }, (function(counter, timeouts){
          return function(input) {
            assert.equal(input.timeout, timeouts[input.url]);
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
          "http://localhost/": "1",
          "http://localhost/contact": "2",
          "http://localhost/services/carpets": "3"
        };
        var selector = function(url) {
          return selectors[url];
        };
        var counter = { count: 0 };
        var result = gen.run({ source: source, selector: selector }, (function(counter, selectors){
          return function(input) {
            assert.equal(input.selector, selectors[input.url]);
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

      it("should replace the default checkInterval in results", function(done) {
        var checkInterval = 1;
        var counter = { count: 0 };
        var result = gen.run({ source: source, checkInterval: checkInterval }, (function(counter, checkInterval){
          return function(input) {
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
              //console.log("outputFile ="+input.outputFile)
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
          "http://localhost/": "/",
          "http://localhost/contact": "/contact",
          "http://localhost/services/carpets": "/services/carpets",
          "http://localhost/services/test%3Farg=one": "/services/test",
          "http://localhost/services/%23hash": "/services"
        };
        var counter = { count: 0 };
        var result = gen.run({ source: source, outputDir: snapshotDir }, (function(counter, snapshotDir, pages){
          return function(input) {
            //console.log("input url = "+input.url);
            //console.log("test url = "+pages[input.url]);
            //console.log("outputFile = "+input.outputFile);
            var re = new RegExp("^("+snapshotDir+")("+pages[input.url]+")");
            var match = re.exec(input.outputFile);
            assert.equal(true, match[1] === snapshotDir && match[2] === pages[input.url]);
            counter.count++;
            if (counter.count===urls)
              done();
          };
        })(counter, snapshotDir, pages));
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
    });
  }
});