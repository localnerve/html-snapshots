/**
 * sitemap.js
 *
 * An input generator for html-snapshots that uses a sitemap.xml file.
 * Creates the snapshot arguments driven from sitemap.xml urls.
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */
var fs = require("fs");
var urlm = require("url");
var path = require("path");
var zlib = require("zlib");
var _ = require("lodash");
var async = require("async");
var xml2js = require("xml2js");
var request = require("request");
var common = require("../common");
var base = require("./_base");

// The default options
var defaults = {
  source: "./sitemap.xml",
  sitemapPolicy: false
};

var sitemap;

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
 */
function stillCurrent(urlNode, options) {
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
 * Convert Buffer input, call next or callback with error
 */
function convert(options, buffer, next, callback) {
  var gunzip = path.extname(options.source) === ".gz";

  if (gunzip) {
    zlib.gunzip(buffer, function(err, result) {
      if (err) {
        callback(err);
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
 * Parse a sitemap document
 * For each qualifying url element in urlset, call base.input
 * Stops processing if an error occurs.
 */
function parse(options, document, callback) {
  xml2js.parseString(document, {
    trim: true,
    normalizeTags: true,
    normalize: true
  }, function(err, result) {
    if (!err) {

      // Process the url input, but break if base.input returns false.
      //   In other words, _.find is looking for a non-falsy err.
      // For now, this can only happen if no outputDir is defined,
      //   which is a fatal bad option problem and will happen immediately.
      _.find(
        // if the sitemap is malformed, just blow up
        result.urlset.url,
        function(urlNode) {
          // optionally ignore current urls by sitemap policy
          var url, process = !options.sitemapPolicy || !stillCurrent(urlNode, options);

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
              err = "error creating input for '"+urlNode.loc[0]+"'";
            }
          }

          return err;
        }
      );
    }

    callback(err);
  });
}

/**
 * Retrieve the sitemap from a url and call to parse it.
 */
function getSitemapUrl(options, callback) {
  request({
    url: options.source,
    encoding: null,
    timeout: options.timeout() // get the default timeout
  }, function(err, res, body) {
    var error = err || common.checkResponse(res, ["text/xml", "application/xml"]);

    if (error) {
      callback("'"+options.source+"' error: "+error);
    } else {
      convert(options, body, parse, callback);
    }
  });
}

/**
 * Retrieve the sitemap from a file and call to parse it.
 */
function getSitemapFile(options, callback) {
  if (!fs.existsSync(options.source)) {
    callback("Could not find input file: "+options.source);
  } else {
    convert(options, fs.readFileSync(options.source), parse, callback);
  }
}

/**
 * generateInput
 *
 * Called back by base.run to generate the input for this input type.
 * This can return true on error for true async. An async error is supplied to listener
 * in this case via _abort.
 */
function generateInput(options) {

  var result = true;

  // callbackify and support async outcomes.
  async.series([
    _.partial(
      common.isUrl(options.source) ? getSitemapUrl : getSitemapFile,
      options
    )
  ],
  function(err) {
    if (err) {
      console.error(err.toString());      
      options._abort(err);
      result = false;
    }
    base.EOI(sitemap);
  });
  
  return result;
}

sitemap = module.exports = {
  /**
   * run
   * Generate the input arguments for snapshots from a robots.txt file.
   * Each input argument generated calls the listener passing the input object.
   */
  run: function(options, listener) {
    base.listener(listener);
    base.defaults(defaults);
    return base.run(options, generateInput);
  }
};