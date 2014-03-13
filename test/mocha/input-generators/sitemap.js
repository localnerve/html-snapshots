var assert = require("assert");
var path = require("path");
var factory = require("../../../lib/input-generators");
var common = require("../../../lib/common");
var server = require("../../server");
var options = require("../../helpers/options");
var smHelper = require("../../helpers/sitemap");
var port = 9333;

describe("input-generator", function() {

  // NOTE: see main input-generator test suite for the standard coverage tests
  // This is just about specific sitemap option processing

  describe("sitemap", function() {

    server.start(path.join(__dirname, "./server"), port);

    var urls = [
      "/",
      "/one",
      "/two",
      "/three",
      "/four/five",
      "six"
    ];
    var sitemapInputGenerators = [
      {
        name: "sitemap-file",
        _testFile: path.join(__dirname, "/server/test_sitemap_dynamic.xml"),
        input: factory.create("sitemap"),
        options: options.decorate({
          source: path.join(__dirname, "/server/test_sitemap_dynamic.xml"),
          sitemapPolicy: true
        })
      },
      {
        name: "sitemap-url",
        _testFile: path.join(__dirname, "/server/test_sitemap_dynamic.xml"),
        input: factory.create("sitemap"),
        options: options.decorate({
          source: "http://localhost:"+port+"/test_sitemap_dynamic.xml",
          sitemapPolicy: true
        })
      }
    ];

    // Run test type "one"
    // Make a dynamic sitemap according to spec.
    // Run the input callbacks match outOfDate, otherwise timeout.
    function testOne(gen, urls, current, missing, inputCallback, testCallback) {

      smHelper.buildSitemapWithPolicy(gen._testFile, urls, current, missing, function() {
        var result = gen.input.run(gen.options, inputCallback);
        testCallback(result);
      });
    }

    // callback that tests for a true result
    function trueResult(result) {
      assert.equal(true, result);
    }

    // create a counter-outofdate-done callback
    function counterOutOfDate(counter, outofdate, done) {
      return function(input) {
        assert.equal(true, counter++ < outofdate);
        if (counter === outofdate)
          done();
      };
    }

    sitemapInputGenerators.forEach(function(gen) {

      describe("policy option true, "+gen.name+",", function() {

        it("should process the expected number of out-of-date urls", function(done) {
          var counter = 0, current = 2;
          var outofdate = urls.length - current;

          testOne(gen, urls, current, smHelper.smElement.all,
            counterOutOfDate(counter, outofdate, done),
            trueResult
          );
        });

        it("should process the all urls if they're all out-of-date", function(done) {
          var counter = 0, current = 0;
          var outofdate = urls.length - current;
          
          testOne(gen, urls, current, smHelper.smElement.all,
            counterOutOfDate(counter, outofdate, done),
            trueResult
          );
        });

        it("should process the urls if they're missing lastmod", function(done) {
          var counter = 0, current = 0;
          var outofdate = urls.length - current;
          
          testOne(gen, urls, current, smHelper.smElement.lastMod,
            counterOutOfDate(counter, outofdate, done),
            trueResult
          );
        });

        it("should process the urls if they're missing changefreq", function(done) {
          var counter = 0, current = 0;
          var outofdate = urls.length - current;
          
          testOne(gen, urls, current, smHelper.smElement.changeFreq,
            counterOutOfDate(counter, outofdate, done),
            trueResult
          );
        });

        it("should process none of the urls if they're all up-to-date", function(done) {
          var counter = 0, current = urls.length;
          var outofdate = urls.length - current;
          
          testOne(gen, urls, current, smHelper.smElement.all, function(input) {
            assert.equal(false, true);
          }, function(result) {
            assert.equal(true, result);
            setTimeout(done, 500);
          });
        });

      });

    });
  });
});