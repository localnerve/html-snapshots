/**
 * sitemap.js
 *
 * An input generator for html-snapshots that uses a sitemap.xml file.
 * Creates the snapshot arguments driven from sitemap.xml urls.
 *
 * Copyright (c) 2013, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 * 
 */
var fs = require("fs");
var http = require("http");
var urlm = require("url");
var xml2js = require("xml2js");
var common = require("../common");
var base = require("./_base");

// The default options
var defaults = {
  source: "./sitemap.xml"
};

var sitemap;

function parse(options, document) {
  var res = { result: true };
  xml2js.parseString(document, { trim: true, normalizeTags: true, normalize: true },
    (function(res){
      return function(err, result){
        var i, urls = result.urlset.url;

        for (i in urls) {
          var url = urlm.parse(urls[i].loc[0]);

          var opts = common.extend({}, options, {
            protocol: url.protocol,
            auth: url.auth,
            hostname: url.hostname,
            port: url.port
            });

          if (!base.input(opts, urls[i].loc[0])) {
            res.result = false;
          }
        }

        if (err) {
          console.error(err);
          res.result = false;
        }
      };
    })(res)
  );
  return res.result;
}

function generateInput(options) {
  var result = true;

  if (common.isUrl(options.source)) {
    var request = http.get(options.source, function(res) {
      var responseBody = "";
      console.log(options.source+" response: "+res.statusCode);
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        responseBody += chunk;
      });
      res.on("end", function(){
        //console.log("responseBody = "+responseBody);
        result = parse(options, responseBody);
      });
    });
    request.on("error", function(e){
      result = false;
      console.error(options.source+" get failed: "+e.message);
    });
  } else {
    if (!fs.existsSync(options.source)) {
      result = false;
      console.error("Could not find input file: "+options.source);
    } else {
      result = parse(options, fs.readFileSync(options.source).toString());
    }
  }

  base.EOI(sitemap);
  return result;
}

sitemap = module.exports = {
  /**
   * run
   * Generate the input arguments for snapshots from a robots.txt file
   * Each input argument generated calls the listener passing the input object.
   */
  run: function(options, listener) {
    base.listener(listener);
    base.defaults(defaults);
    return base.run(options, generateInput);
  }
};