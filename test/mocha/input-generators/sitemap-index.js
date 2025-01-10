/**
 * Sitemap-index tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
/* global describe, it, before */
const assert = require("assert");
const path = require("path");
const factory = require("../../../lib/input-generators");
const server = require("../../server");
const options = require("../../helpers/options");
// var smHelper = require("../../helpers/sitemap");
const port = 9334;

describe("input-generator", function () {

  // NOTE: see main input-generator test suite for the standard coverage tests
  // This is just about specific sitemap index option processing

  describe("sitemap-index", function () {
    let gen;
    const outputDir = path.join(__dirname, "snapshots");

    function createOptions (overrideOptions) {
      const basicOptions = {
        input: "sitemap-index",
        outputDirClean: true,
        outputDir,
        port
      };
      return {
        ...basicOptions,
        ...overrideOptions
      };
    }

    function fail (done, message) {
      const msg = message.toString();
      assert.fail(msg);
      done(new Error(msg));
    }

    before(function () {
      server.start(path.join(__dirname, "./server"), port);
      gen = factory.create("sitemap-index");
    });

    it("should handle empty sitemap-index", function (done) {
      const source = `http://localhost:${port}/test_sitemap_index_empty.xml`;
      const opts = createOptions({
        source,
        _abort: err => {
          const msg = `empty sitemap-index should not abort, ${err}`;
          fail(done, msg);
        }
      });

      const result = gen.run(options.decorate(opts), () => {
        fail(done, "empty sitemap-index should not produce input");
      });

      result.then(() => done()).catch(fail.bind(null, done));
    });

    it("should handle malformed sitemap-index", function (done) {
      const source = `http://localhost:${port}/test_sitemap_index_malformed.xml`;
      const opts = createOptions({
        source,
        _abort: err => {
          assert.equal(true, !!err, `${source} should have aborted with error`);
          done();
        }
      });

      const result = gen.run(
        options.decorate(opts),
        fail.bind(null, done, `Input handler was called unexpectedly for badSource: ${source}`)
      );

      result.then(() => assert.ok(true)).catch(fail.bind(null, done));
    });

    it("TODO: write specific sitemap-index tests", function () {
      assert.ok(true);
    });
  });
});
