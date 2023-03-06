/**
 * robots.js
 *
 * An input generator for html-snapshots that uses a simple robots.txt file.
 * Creates the snapshot arguments driven from robots.txt Sitemap or Allow directives.
 *
 * Copyright (c) 2013 - 2023 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */

const fs = require("fs").promises;
const common = require("../common");
const { sitemapCollection: smc } = require("../common/sitemap");
const base = require("./_base");

// The default options
const defaults = Object.freeze({
  source: "./robots.txt",
  hostname: "localhost"
});

const robots = {
  /**
   * Generate the input arguments for snapshots from a robots.txt file
   * Each input argument generated calls the listener passing the input object.
   *
   * @param {Object} options - Robots options.
   * @param {Function} listener - Callback to receive each input.
   * @returns {Promise} Resolves to undefined on completion.
   */
  run: function (options, listener) {
    const opts = Object.assign({}, base.defaults(defaults), options);

    return base.run(opts, generateInput, listener);
  }
};

/**
 * Get all unique `Allow:` url paths from robots.txt.
 * Reads the allow values up to whitespace (end-of-line), or wildcard.
 * 
 * @param {String} body - The robots.txt file
 * @returns {Array} collection of allow url paths
 */
function getAllowUrls (body) {
  const allowUrls = new Set();
  const re = /\ballow\b\s*:\s*(?<allowUrl>[^*\s]+)/ig;
  const matches = body.matchAll(re);
  let allowUrl;

  for (const match of matches) {
    allowUrl = match?.groups?.allowUrl;
    if (allowUrl) {
      allowUrls.add(allowUrl);
    }
  }

  return allowUrls.size > 0 ? Array.from(allowUrls) : null;
}

/**
 * Get all the unique sitemap urls from robots.txt.
 * 
 * @param {String} body - The robots.txt file
 * @returns {Array} collection of unqiue sitemap urls
 */
function getSitemapUrls (body) {
  const sitemapUrls = new Set();
  const re = /\bsitemap\b\s*:\s*(?<sitemapUrl>[^\s]+)/ig;
  const matches = body.matchAll(re);
  let sitemapUrl;
  
  for (const match of matches) {
    sitemapUrl = match?.groups?.sitemapUrl;
    if (sitemapUrl) {
      sitemapUrls.add(sitemapUrl);
    }
  }
  
  return sitemapUrls.size > 0 ? Array.from(sitemapUrls) : null;
}

/**
 * Parse urls from robots.txt and generate input.
 * Look for sitemaps first, then look for allow urls.
 * 
 * @param {Object} options - robots.txt options
 * @param {String} body - robots.txt content
 * @returns {Promise} resolves on success
 */
function processRobotsTxt (options, body) {
  let allowUrls = false;
  const urls = getSitemapUrls(body) || (allowUrls = getAllowUrls(body));

  if (allowUrls) {
    let result;
    for (const url of urls) {
      result = base.input(options, url);
      // if base.input returns false, then no outputDir was defined,
      //   which is a fatal bad option problem and will happen immediately.
      if (!result) {
        throw new Error(
          common.prependMsgToErr(base.generatorError(), url, true)
        );
      }
    }
    return Promise.resolve();
  } else {
    if (urls && urls.length > 0) {
      return smc.process(options, urls);
    }
    throw new Error(`No urls found in ${options.source}`);
  }
}

/**
 * Retrieves robots.txt from url and parses it.
 *
 * @param {Object} options - Robots.txt options
 * @param {String} options.source - The URL to a robots.txt
 * @param {Function} options.timeout - Returns the robots.txt request timeout.
 * @returns {Promise} resolves to undefined.
 */
async function getRobotsUrl (options) {
  const { default:got } = await import("got");
  return got({
    url: options.source,
    timeout: {
      request: options.timeout()
    }
  }).then(res => {
    const error = common.checkResponse(res, "text/plain");
    if (error) {
      throw new Error(error);
    }
    return processRobotsTxt(options, res.body.toString());
  }).catch(err => {
    throw new Error(common.prependMsgToErr(err, options.source, true));
  });
}

/**
 * Reads the robots.txt file and parses it.
 * 
 * @param {Object} options - Robots.txt options
 */
function getRobotsFile (options) {
  return fs.readFile(options.source)
    .then(data => processRobotsTxt(options, data.toString()))
    .catch(err => {
      throw new Error(common.prependMsgToErr(err, options.source, true));
    });
}

/**
 * Generate the snapshot arguments from a robots.txt file.
 * Each line that has "Allow:" contains a url we need a snapshot for.
 * This can return true on error for true async. An async error is supplied to listener
 * in this case via _abort.
 *
 * @param {Object} options - input generator options object.
 * @param {String} options.source - A url or file path.
 * @param {Function} options._abort - Abort function to stop the async notifier.
 * @returns {Promise} Resolves to undefined on completion.
 */
function generateInput (options) {
  const retrieve = common.isUrl(options.source) ? getRobotsUrl : getRobotsFile;
  return retrieve(options)
    .catch(err => {
      options._abort(err);
    })
    .then(() => {
      base.EOI(robots);
    });
}

module.exports = robots;
