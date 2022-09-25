/**
 * Library tests focused on the useJQuery option.
 *
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
/* global it */
const assert = require("assert");
const path = require("path");
const _ = require("lodash");
const utils = require("./utils");
const optHelp = require("../../helpers/options");
const ss = require("../../../lib/html-snapshots");

const {
  timeout,
  outputDir,
  cleanup,
  cleanupError,
  unexpectedError,
  unexpectedSuccess,
  checkActualFiles
} = utils;

const useJQOutputDir = path.resolve(outputDir, "..", "useJQuery");

function useJQueryTests (options) {
  const {
    port
  } = options;

  function createOptions (newOptions) {
    const defaultOptions = {
      input: "array",
      source: [ `http://localhost:${port}/nojq` ],
      selector: ".nojq-dynamic",
      outputDir: useJQOutputDir,
      outputDirClean: true,
      browser: "phantomjs",
      timeout,
      useJQuery: true
    };
    return {
      ...defaultOptions,
      ...newOptions
    };
  }

  return function () {
    it("should succeed if useJQuery=false, jQuery NOT loaded, dynamic element",
    function (done) {
      const options = createOptions({
        useJQuery: false
      });

      ss.run(optHelp.decorate(options), (err, completed) => {
        if (err) {
          console.log(`@@@ error = ${err}, completed=${completed.join(',')}`);
        }
      })
        .then(completed => {
          let assertionError;
          try {
            assert.equal(completed.length, 1);
            assert.equal(completed[0], path.join(useJQOutputDir, "nojq", "index.html"));
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        })
        .catch(e => {
          checkActualFiles(e.notCompleted)
            .then(() => {
              cleanup(done, e || unexpectedError);
            });
        });
    });

    it("should succeed if useJQuery=true, jQuery loaded", function (done) {
      const options = createOptions({
        source: [ `http://localhost:${port}/` ],
        selector: "#dynamic-content",
        outputDir
      });

      ss.run(optHelp.decorate(options), (err, completed) => {
        if (err) {
          console.log(`@@@ error = ${err}, completed=${completed.join(',')}`);
        }
      })
        .then(completed => {
          var assertionError;
          try {
            assert.equal(completed.length, 1);
            assert.equal(completed[0], path.join(outputDir, "index.html"));
          } catch (e) {
            assertionError = e;
          }
          cleanup(done, assertionError);
        })
        .catch(e => {
          checkActualFiles(e.notCompleted)
            .then(() => {
              cleanup(done, e || unexpectedError);
            });
        });
    });

    it("should fail if useJQuery is true and no jQuery loads in target page",
    function (done) {
      const options = createOptions({
        selector: "#pocs1",
        timeout: 4000
      });

      const twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    it("should fail if useJQuery is false, no jQuery loads in page, BUT the element is not visible",
    function (done) {
      const options = createOptions({
        selector: ".nojq-notvisible",
        timeout: 4000
      });

      const twice = _.after(2, cleanupError.bind(null, done, 0));

      ss.run(optHelp.decorate(options), twice)
        .then(unexpectedSuccess.bind(null, done))
        .catch(twice);
    });

    // most of these tests use useJQuery false and jQuery loads in target page,
    // so not testing that combo that should always succeed as long as the
    // selector is not dependent on jQuery.
  };
}

module.exports = {
  testSuite: useJQueryTests
};
