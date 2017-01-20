/**
 * sitemap.js
 *
 * An input generator for html-snapshots that uses a sitemap.xml file.
 * Creates the snapshot arguments driven from sitemap.xml urls.
 *
 * Copyright (c) 2013 - 2017 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var urlm = require("url");
var zlib = require("zlib");
var _ = require("lodash");
var xml2js = require("xml2js");
var request = require("request");
var common = require("./index");
var base = require("../input-generators/_base");

// the out of date fallback
var unixStart = "1970-01-01T00:00:00.000Z";

// milliseconds for changefreq
var changeFreq = {
  always: -Number.MAX_VALUE,
  hourly: 3600000,
  daily: 86400000,
  weekly: 604800000,
  monthly: 2629740000,
  yearly: 31560000000,
  never: Number.MAX_VALUE
};

/**
 * Return true if the urlNode is still current (not stale) by sitemap policy.
 * If both lastmod and changefreq tags are supplied both are used.
 * If only one of lastmod or changefreq are supplied,
 *   then they are compared against previous output if it exists.
 * If a test fails for any reason, it is characterized as stale (returns false).
 *
 * @param {Object} urlNode - Sitemap XML url node as an object.
 * @param {Object} options - Sitemap options object, passed through.
 */
function stillCurrent (urlNode, options) {
  var lesser, greater, oPath;
  var now = Date.now();
  var lMod = _.first(urlNode.lastmod);
  var cFreq = _.first(urlNode.changefreq) ? _.first(urlNode.changefreq).toLowerCase() : null;

  // only lastmod specified
  if (lMod && !cFreq) {
    // if sitemap is malformed, just blow up
    oPath = base.outputFile(options, urlNode.loc[0]);

    lesser = now - ( (fs.existsSync(oPath) && fs.statSync(oPath).mtime.getTime()) || unixStart );
    greater = now - Date.parse(lMod);
  }
  // only changefreq specified
  else if (!lMod && cFreq) {
    // if sitemap is malformed, just blow up
    oPath = base.outputFile(options, urlNode.loc[0]);

    lesser = now - ( (fs.existsSync(oPath) && fs.statSync(oPath).mtime.getTime()) || unixStart );
    greater = changeFreq[cFreq] || changeFreq.always;
  }
  // both or neither were specified
  else {
    lesser = now - Date.parse(lMod || unixStart);
    greater = changeFreq[cFreq] || changeFreq.always;
  }

  return lesser <= greater;
}

/**
 * Parse a sitemap document
 * For each qualifying url element in urlset, call base.input
 * Stops processing if an error occurs.
 *
 * @param {Object} options - Sitemap options.
 * @param {String} options.source - The sitemap url or file.
 * @param {Boolean} options.sitemapPolicy - True if sitemapPolicy should be enforced.
 * @param {String} document - An xml document string.
 * @param {Function} callback - The completion callback.
 */
function parse (options, document, callback) {
  xml2js.parseString(document, {
    trim: true,
    normalizeTags: true,
    normalize: true
  }, function (err, result) {
    var source = options.source;

    if (!err) {

      // Process the url input, but break if base.input returns false.
      //   In other words, _.find is looking for a non-falsy err.
      // For now, this can only happen if no outputDir is defined,
      //   which is a fatal bad option problem and will happen immediately.
      _.find(
        // if the sitemap is malformed, just blow up
        result.urlset.url,
        function (urlNode) {
          // optionally ignore current urls by sitemap policy
          var url,
              process = !options.sitemapPolicy ||
                !stillCurrent(urlNode, options);

          if (process) {
            // if sitemap is malformed, just blow up
            url = urlm.parse(urlNode.loc[0]);
            if (!base.input(_.extend({}, options, {
                protocol: url.protocol,
                auth: url.auth,
                hostname: url.hostname,
                port: url.port
              }),
              urlNode.loc[0])
            ) {
              source = urlNode.loc[0];
              err = base.generatorError();
            }
          }

          return err;
        }
      );
    }

    callback(common.prependMsgToErr(err, source, true));
  });
}

/**
 * Convert Buffer input, call next or callback with error
 *
 * @param {Object} options - Sitemap options.
 * @param {String} options.source - Sitemap URL.
 * @param {Buffer} buffer - A node buffer.
 * @param {Function} next - A function to run after optional conversion applied.
 * @param {Function} callback - A completion callback.
 */
function convert(options, buffer, next, callback) {
  var gunzip = path.extname(options.source) === ".gz";

  if (gunzip) {
    zlib.gunzip(buffer, function (err, result) {
      if (err) {
        callback(common.prependMsgToErr(err, options.source, true));
      } else {
        next(options, result && result.toString(), callback);
      }
    });
  }
  else {
    next(options, buffer.toString(), callback);
  }
}

/**
 * Retrieve the sitemap from a url and call to parse it.
 *
 * @param {Object} options - Sitemap options.
 * @param {String} options.source - Sitemap URL.
 * @param {Function} options.timeout - User supplied run timeout.
 * @param {Function} parseFn - A data parser function.
 * @param {Function} callback - A completion callback function.
 */
function getUrl (options, parseFn, callback) {
  request({
    url: options.source,
    encoding: null,
    timeout: options.timeout() // get the default timeout
  }, function (err, res, body) {
    var error = err || common.checkResponse(res, ["text/xml", "application/xml"]);

    if (error) {
      callback(common.prependMsgToErr(error, options.source, true));
    } else {
      convert(options, body, parseFn, callback);
    }
  });
}

/**
 * Retrieve the sitemap from a file and call to parse it.
 *
 * @param {Object} options - Sitemap options.
 * @param {String} options.source - Sitemap file path.
 * @param {Function} parseFn - A data parser function.
 * @param {Function} callback - A completion callback.
 */
function getFile (options, parseFn, callback) {
  fs.readFile(options.source, function (err, data) {
    if (err) {
      callback(common.prependMsgToErr(err, options.source, true));
    } else {
      convert(options, data, parseFn, callback);
    }
  });
}

module.exports = {
  getFile: getFile,
  getUrl: getUrl,
  stillCurrent: stillCurrent,
  parse: parse
};
