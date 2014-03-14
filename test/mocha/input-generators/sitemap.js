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

    // Run a dynamic sitemap input processing test.
    // Make a dynamic sitemap according to spec.
    // After sitemap made, process the input calling the given `inputCallback`.
    // After input processing started, evaluate the result calling `resultCallback`.
    function dynSMIP(gen, urls, current, missing, inputCallback, resultCallback) {

      smHelper.buildSitemapWithPolicy(gen._testFile, urls, current, missing, function() {
        resultCallback( gen.input.run(gen.options, inputCallback) );
      });
    }

    // A callback that tests for a truthy result
    function trueResult(result) {
      assert.equal(true, result);
    }

    // Create a callback counter callback
    // This makes a callback that checks to make sure the number of times
    //   it is called back does not exceed the given `limit`. Once that limit
    //   is reached, it calls the given `done` callback.
    // In the interim, if it is called more than the limit, it asserts an error.
    function callbackCounter(limit, done) {
      var counter = 0;
      return function() {
        assert.equal(true, counter++ < limit);
        if (counter === limit) {
          setTimeout(done, 500);
        }
      };
    }

    sitemapInputGenerators.forEach(function(gen) {

      describe("policy option true, "+gen.name+",", function() {

        it("should process the expected number of out-of-date urls", function(done) {
          var current = 2;
          var outofdate = urls.length - current;

          dynSMIP(gen, urls, current, smHelper.smElement.all,
            callbackCounter(outofdate, done),
            trueResult
          );
        });

        it("should process the all urls if they're all out-of-date", function(done) {
          var current = 0;
          var outofdate = urls.length - current;
          
          dynSMIP(gen, urls, current, smHelper.smElement.all,
            callbackCounter(outofdate, done),
            trueResult
          );
        });

        it("should process the urls if they're missing lastmod", function(done) {
          var current = 0;
          var outofdate = urls.length - current;
          
          dynSMIP(gen, urls, current, smHelper.smElement.lastMod,
            callbackCounter(outofdate, done),
            trueResult
          );
        });

        it("should process the urls if they're missing changefreq", function(done) {
          var current = 0;
          var outofdate = urls.length - current;
          
          dynSMIP(gen, urls, current, smHelper.smElement.changeFreq,
            callbackCounter(outofdate, done),
            trueResult
          );
        });

        it("should process none of the urls if they're all up-to-date", function(done) {
          var current = urls.length;
          var outofdate = urls.length - current;
          
          dynSMIP(gen, urls, current, smHelper.smElement.all, function() {
            // This should not be called ever
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