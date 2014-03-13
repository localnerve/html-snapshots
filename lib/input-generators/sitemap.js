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
var http = require("http");
var urlm = require("url");
var _ = require("underscore");
var async = require("async");
var xml2js = require("xml2js");
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

// Return true if the urlNode is still current (not stale) by sitemap policy
function stillCurrent(urlNode) {
  var lMod = urlNode.lastmod && urlNode.lastmod.length > 0 ?
              urlNode.lastmod[0] : unixStart;

  var cFreq = urlNode.changefreq && urlNode.changefreq.length > 0 ?
              urlNode.changefreq[0].toLowerCase() : null;

  return (Date.now() - Date.parse(lMod)) <= (changeFreq[cFreq] || -Number.MAX_VALUE);
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
      var url, urlNode;

      // process the url input, but break if one fails
      _.find(
        result.urlset.url,
        function(urlNode) {
          // optionally ignore current urls by sitemap policy
          var process = !options.sitemapPolicy || !stillCurrent(urlNode);

          if (process) {
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
  var request = http.get(options.source, function(res) {
    var responseBody = "";
    console.log(options.source+" response: "+res.statusCode);
    res.setEncoding("utf8");

    res.on("data", function (chunk) {
      responseBody += chunk;
    });
    res.on("end", function() {
      parse(options, responseBody, callback);
    });
  });
  request.on("error", function(e) {
    callback(options.source+" get failed: "+e.message);
  });
}

/**
 * Retrieve the sitemap from a file and call to parse it.
 */
function getSitemapFile(options, callback) {
  if (!fs.existsSync(options.source)) {
    callback("Could not find input file: "+options.source);
  } else {
    parse(options, fs.readFileSync(options.source).toString(), callback);
  }
}

/**
 * generateInput
 *
 * Called back by base.run to generate the input for this input type.
 * Async processing is always required, can return true on error, however async error supplied to listener.
 */
function generateInput(options) {

  var result = true;

  // callbackify
  async.series([
    _.partial(
      common.isUrl(options.source) ? getSitemapUrl : getSitemapFile,
      options
    )
  ],
  function(err) {
    if (err) {
      console.error(err.toString());
      if (_.isFunction(options._listener)) options._listener(err);
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