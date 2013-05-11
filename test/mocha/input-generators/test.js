var assert = require("assert");
var path = require("path");
var factory = require("../../../lib/input-generators");

describe("input-generators", function(){

  describe("null generator", function(){
    it("'index' should return a null generator", function(){
      assert.equal(true, factory.isNull(factory.create("index")));
    });

    it("'_common' should return a null generator", function(){
      assert.equal(true, factory.isNull(factory.create("_common")));
    });

    it("'_any' should return a null generator", function(){
      assert.equal(true, factory.isNull(factory.create("_any")));
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

  describe("robots generator", function() {
    var gen = factory.create("robots");
    var inputFile = path.join(__dirname, "robots.txt");
    var urls = 3;

    it("should return false for null", function() {
      assert.equal(false, factory.isNull(gen));
    });

    it("should have a run method", function(){
      assert.equal(true, typeof gen.run === 'function');
    });

    // requires inputFile not found
    it("should produce no input for defaults", function() {
      assert.equal(true, gen.run().length===0);
    });

    // requires qualified inputFile to have 'urls' valid entries
    it("should produce input with defaults plus valid inputFile", function() {
      assert.equal(true, gen.run({ inputFile: inputFile }).length===urls);
    });

    it("should accept scalar timeout and apply globally", function() {
      var input = gen.run({ inputFile: inputFile, timeout: 1});
      assert.equal(true, (function(input){
          var result = true;
          for (var i in input) {
            if (input[i].timeout !== 1) {
              result = false;
              break;
            }
          }
          return result;
        })(input)
      );
    });

    // requires ./robots.txt to contain specific urls
    it("should accept function timeout and apply per url", function() {
      var timeouts = {
        "http://localhost/": 1,
        "http://localhost/contact": 2,
        "http://localhost/services/carpets": 3
      };
      var timeout = function(url) {
        return timeouts[url];
      };
      var input = gen.run({ inputFile: inputFile, timeout: timeout });
      assert.equal(true, (function(input, timeouts){
          var result = true;
          for (var i in input) {
            /*console.log("local url: "+input[i].url);
            console.log("local timeout: "+ timeouts[input[i].url]);
            console.log("input timeout: "+input[i].timeout);*/
            if (input[i].timeout !== timeouts[input[i].url]) {
              result = false;
              break;
            }
          }
          return result;
        })(input, timeouts)
      );
    });

    it("should accept scalar selector and apply globally", function() {
      var selector = "foo";
      var input = gen.run({ inputFile: inputFile, selector: selector });
      assert.equal(true, (function(input, selector){
          var result = true;
          for (var i in input) {
            if (input[i].selector !== selector) {
              result = false;
              break;
            }
          }
          return result;
        })(input, selector)
      );
    });

    // requires ./robots.txt to contain specific urls
    it("should accept function selector and apply per url", function() {
      var selectors = {
        "http://localhost/": "1",
        "http://localhost/contact": "2",
        "http://localhost/services/carpets": "3"
      };
      var selector = function(url) {
        return selectors[url];
      };
      var input = gen.run({ inputFile: inputFile, selector: selector });
      assert.equal(true, (function(input, selectors){
          var result = true;
          for (var i in input) {
            if (input[i].selector !== selectors[input[i].url]) {
              result = false;
              break;
            }
          }
          return result;
        })(input, selectors)
      );
    });

    it("should replace the default hostname in results", function(){
      var hostname = "foo";
      var input = gen.run({ inputFile: inputFile, hostname: hostname });
      assert.equal(true, (function(input, hostname){
          var re, match, result = true;
          for (var i in input) {
            re = new RegExp("http://("+hostname+")/");
            match = re.exec(input[i].url);
            if (match[1] !== hostname) {
              result = false;
              break;
            }
          }
          return result;
        })(input, hostname)
      );
    });

    it("should replace the default protocol in results", function(){
      var proto = "https";
      var input = gen.run({ inputFile: inputFile, protocol: proto });
      assert.equal(true, (function(input, proto){
          var re, match, result = true;
          for (var i in input) {
            re = new RegExp("^("+proto+")://");
            match = re.exec(input[i].url);
            if (match[1] !== proto) {
              result = false;
              break;
            }
          }
          return result;
        })(input, proto)
      );
    });

    it("should replace the default checkInterval in results", function() {
      var checkInterval = 1;
      var input = gen.run({ inputFile: inputFile, checkInterval: checkInterval });
      assert.equal(true, (function(input, checkInterval){
          var result = true;
          for (var i in input) {
            if (input[i].checkInterval !== checkInterval) {
              result = false;
              break;
            }
          }
          return result;
        })(input, checkInterval)
      );
    });

    it("should contain the snapshot directory in output outfile spec", function(){
      var snapshotDir = "foo";
      var input = gen.run({ inputFile: inputFile, snapshotDir: snapshotDir });
      assert.equal(true, (function(input, snapshotDir){
          var re, match, result = true;
          for (var i in input) {
            re = new RegExp("^("+snapshotDir+")/");
            match = re.exec(input[i].outputFile);
            if (match[1] !== snapshotDir) {
              result = false;
              break;
            }
          }
          return result;
        })(input, snapshotDir)
      );
    });

    // requires inputFile to contain specific urls
    it("should contain the page structure in the output file spec", function() {
      var snapshotDir = "foo";
      var pages = {
        "http://localhost/": "/",
        "http://localhost/contact": "/contact",
        "http://localhost/services/carpets": "/services/carpets"
      };
      var input = gen.run({ inputFile: inputFile, snapshotDir: snapshotDir });
      assert.equal(true, (function(input, snapshotDir, pages){
          var re, match, result = true;
          for (var i in input) {
            re = new RegExp("^("+snapshotDir+")("+pages[input[i].url]+")");
            match = re.exec(input[i].outputFile);
            if (match[1] !== snapshotDir || match[2] !== pages[input[i].url]) {
              result = false;
              break;
            }
          }
          return result;
        })(input, snapshotDir, pages)
      );
    });
  });

  describe("textfile generator", function() {
    var gen = factory.create("textfile");
    var inputFile = path.join(__dirname, "line.txt");
    var urls = 3;

    it("should return false for null", function() {
      assert.equal(false, factory.isNull(gen));
    });

    it("should have a run method", function(){
      assert.equal(true, typeof gen.run === 'function');
    });

    // requires default inputFile not found
    it("should produce no input for defaults", function() {
      assert.equal(true, gen.run().length===0);
    });

    // requires qualified inputFile to have 'urls' valid entries
    it("should produce input with defaults plus valid inputFile", function() {
      assert.equal(true, gen.run({ inputFile: inputFile }).length===urls);
    });

    it("should accept scalar timeout and apply globally", function() {
      var input = gen.run({ inputFile: inputFile, timeout: 1});
      assert.equal(true, (function(input){
          var result = true;
          for (var i in input) {
            if (input[i].timeout !== 1) {
              result = false;
              break;
            }
          }
          return result;
        })(input)
      );
    });

    // requires inputFile to contain specific urls
    it("should accept function timeout and apply per url", function() {
      var timeouts = {
        "http://localhost/": 1,
        "http://localhost/contact": 2,
        "http://localhost/services/carpets": 3
      };
      var timeout = function(url) {
        return timeouts[url];
      };
      var input = gen.run({ inputFile: inputFile, timeout: timeout });
      assert.equal(true, (function(input, timeouts){
          var result = true;
          for (var i in input) {
            /*console.log("local url: "+input[i].url);
            console.log("local timeout: "+ timeouts[input[i].url]);
            console.log("input timeout: "+input[i].timeout);*/
            if (input[i].timeout !== timeouts[input[i].url]) {
              result = false;
              break;
            }
          }
          return result;
        })(input, timeouts)
      );
    });

    it("should accept scalar selector and apply globally", function() {
      var selector = "foo";
      var input = gen.run({ inputFile: inputFile, selector: selector });
      assert.equal(true, (function(input, selector){
          var result = true;
          for (var i in input) {
            if (input[i].selector !== selector) {
              result = false;
              break;
            }
          }
          return result;
        })(input, selector)
      );
    });

    // requires inputFile to contain specific urls
    it("should accept function selector and apply per url", function() {
      var selectors = {
        "http://localhost/": "1",
        "http://localhost/contact": "2",
        "http://localhost/services/carpets": "3"
      };
      var selector = function(url) {
        return selectors[url];
      };
      var input = gen.run({ inputFile: inputFile, selector: selector });
      assert.equal(true, (function(input, selectors){
          var result = true;
          for (var i in input) {
            if (input[i].selector !== selectors[input[i].url]) {
              result = false;
              break;
            }
          }
          return result;
        })(input, selectors)
      );
    });

    it("should replace the default hostname in results", function(){
      var hostname = "foo";
      var input = gen.run({ inputFile: inputFile, hostname: hostname });
      assert.equal(true, (function(input, hostname){
          var re, match, result = true;
          for (var i in input) {
            re = new RegExp("http://("+hostname+")/");
            match = re.exec(input[i].url);
            if (match[1] !== hostname) {
              result = false;
              break;
            }
          }
          return result;
        })(input, hostname)
      );
    });

    it("should replace the default protocol in results", function(){
      var proto = "https";
      var input = gen.run({ inputFile: inputFile, protocol: proto });
      assert.equal(true, (function(input, proto){
          var re, match, result = true;
          for (var i in input) {
            re = new RegExp("^("+proto+")://");
            match = re.exec(input[i].url);
            if (match[1] !== proto) {
              result = false;
              break;
            }
          }
          return result;
        })(input, proto)
      );
    });

    it("should replace the default checkInterval in results", function() {
      var checkInterval = 1;
      var input = gen.run({ inputFile: inputFile, checkInterval: checkInterval });
      assert.equal(true, (function(input, checkInterval){
          var result = true;
          for (var i in input) {
            if (input[i].checkInterval !== checkInterval) {
              result = false;
              break;
            }
          }
          return result;
        })(input, checkInterval)
      );
    });

    it("should contain the snapshot directory in output outfile spec", function(){
      var snapshotDir = "foo";
      var input = gen.run({ inputFile: inputFile, snapshotDir: snapshotDir });
      assert.equal(true, (function(input, snapshotDir){
          var re, match, result = true;
          for (var i in input) {
            re = new RegExp("^("+snapshotDir+")/");
            match = re.exec(input[i].outputFile);
            if (match[1] !== snapshotDir) {
              result = false;
              break;
            }
          }
          return result;
        })(input, snapshotDir)
      );
    });

    // requires inputFile to contain specific urls
    it("should contain the page structure in the output file spec", function() {
      var snapshotDir = "foo";
      var pages = {
        "http://localhost/": "/",
        "http://localhost/contact": "/contact",
        "http://localhost/services/carpets": "/services/carpets"
      };
      var input = gen.run({ inputFile: inputFile, snapshotDir: snapshotDir });
      assert.equal(true, (function(input, snapshotDir, pages){
          var re, match, result = true;
          for (var i in input) {
            re = new RegExp("^("+snapshotDir+")("+pages[input[i].url]+")");
            match = re.exec(input[i].outputFile);
            if (match[1] !== snapshotDir || match[2] !== pages[input[i].url]) {
              result = false;
              break;
            }
          }
          return result;
        })(input, snapshotDir, pages)
      );
    });
  });

});