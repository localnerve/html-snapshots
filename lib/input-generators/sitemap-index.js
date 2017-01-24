/**
 * sitemap-index.js
 *
 * An input generator for html-snapshots that uses a sitemap index xml file.
 * Creates the snapshot arguments driven from multiple sitemap.xml urls.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/* global Promise */
"use strict";

var fs = require("fs");
var pathLib = require("path");
var _ = require("lodash");
var mkdirp = require("mkdirp");
var xml2js = require("xml2js");
var common = require("../common");
var nodeCall = require("../common/node");
var smLib = require("../common/sitemap");
var base = require("./_base");

// The default options
var defaults = Object.freeze({
  source: "./sitemap-index.xml",
  sitemapPolicy: false,
  // Truthy, directs sitemapIndex sitemap file storage for sitemapPolicy purpose.
  sitemapOutputDir: "_sitemaps_"
});

var sitemapIndex;

/**
 * Make sure path exists so a sitemap write can succeed.
 *
 * @param {String} outputPath - File path and name.
 * @param {Funcion} callback - Completion callback.
 */
function prepareWrite (outputPath, callback) {
  var path = pathLib.parse(outputPath);
  var dir = pathLib.join(path.root, path.dir);
  mkdirp(dir, callback);
}

/**
 * Parse a sitemap, generate input, and optionally update the local file
 * for sitemapPolicy purposes.
 * This writes the sitemap files out EVEN IF sitemapPolicy is false.
 * The thinking is that it's better/cheaper to do this b/c if sitemapPolicy is
 * enabled later, then there is something to compare against, for more savings.
 *
 * @param {Object} options - Sitemap options.
 * @param {Object} options.__sitemapIndex - Sitemap Index options.
 * @param {String} document - xml document string.
 * @param {Function} callback - A completion callback.
 */
function processSitemap (options, document, callback) {
  smLib.parse(options, document, function (err) {
    var sitemapIndexOpts = options.__sitemapIndex;
    var outputPath = base.outputFile(sitemapIndexOpts, options.source);

    if (!err && sitemapIndexOpts.sitemapOutputDir) {
      prepareWrite(outputPath, function (err) {
        if (!err) {
          fs.writeFile(outputPath, document, callback);
        } else {
          callback(common.prependMsgToErr(err, outputPath, true));
        }
      });
    } else {
      callback(err);
    }
  });
}

/**
 * Parse a sitemap index document
 * For each qualifying sitemap element, download, parse the sitemap.
 * Stops processing if an error occurs.
 *
 * @param {Object} options - Sitemap options.
 * @param {Boolean} options.sitemapPolicy - True if sitemap policy should be used.
 * @param {String} document - xml document string.
 * @param {Function} callback - A completion callback.
 */
function parse (options, document, callback) {
  xml2js.parseString(document, {
    trim: true,
    normalizeTags: true,
    normalize: true
  }, function (err, result) {
    var sitemapUrls = [];
    var sitemapIndexOptions = Object.assign({}, options, {
      outputPath: undefined
    });

    if (!err) {
      // Check if we should process each sitemap in the index.
      _.forEach(
        // if the sitemap index is malformed, just blow up
        result.sitemapindex.sitemap,
        function (sitemapNode) {
          // optionally ignore current sitemaps by sitemap policy
          var shouldProcess = !options.sitemapPolicy ||
            !smLib.stillCurrent(sitemapNode, sitemapIndexOptions);

          if (shouldProcess) {
            // if sitemap index is malformed, just blow up
            sitemapUrls.push(sitemapNode.loc[0]);
          }
        }
      );

      // Edge case message for clarity
      if (sitemapUrls.length === 0) {
        console.log("[*] No sitemaps qualified for processing");
      }

      // Get all the sitemaps, parse them, and generate input for each
      Promise.all(sitemapUrls.map(function (sitemapUrl) {
        var sitemapOptions = Object.assign({}, options, {
          source: sitemapUrl,
          input: "sitemap",
          sitemapOutputDir: false,
          __sitemapIndex: sitemapIndexOptions
        });

        console.log("[+] Loading the sitemap: '"+sitemapUrl+"'");

        return nodeCall(smLib.getUrl, sitemapOptions, processSitemap);
      }))
        .then(function () {
          // Ignore the array of results to this function
          callback();
        })
        .catch(callback);
    } else {
      callback(err);
    }
  });
}

/**
 * generateInput
 *
 * Called back by base.run to generate the input for this input type.
 * This can return true on error for true async. An async error is supplied to listener
 * in this case via _abort.
 *
 * @param {Object} options - Sitemap options.
 * @param {String} options.source - Sitemap URL or file path.
 */
function generateInput (options) {
  return nodeCall(
    common.isUrl(options.source) ? smLib.getUrl : smLib.getFile,
    options,
    parse
  )
    .catch(function (err) {
      options._abort(err);
    })
    .then(function () {
      base.EOI(sitemapIndex);
    });
}

sitemapIndex = module.exports = {
  /**
   * Generate the input arguments for snapshots from a robots.txt file.
   * Each input argument generated calls the listener passing the input object.
   *
   * @param {Object} options - Sitemap index options.
   * @param {Function} listener - Callback to receive each input.
   * @returns {Promise} Resolves to undefined on completion.
   */
  run: function (options, listener) {
    var opts = Object.assign({}, base.defaults(defaults), options);

    return base.run(opts, generateInput, listener);
  }
};
