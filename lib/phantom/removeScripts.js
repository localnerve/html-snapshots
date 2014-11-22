/*
 * removeScripts.js
 *
 * Produce a single snapshot for a web page.
 * Snapshot taken when selector is(:visible).
 * Applies a single filter to remove any script tags.
 *
 * This is a phantomJS script that runs in phantomjs.
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
var selectorDetect = require("./modules/selectorDetect");
var cli = require("./modules/cli");
var detectors = require("./modules/detectors");

/**
 * Remove all script tags from content
 */
function removeScriptTags(content) {
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

var options = cli.selector();

selectorDetect(
  options, 
  options.useJQuery ? detectors.jquerySelector : detectors.querySelector,
  removeScriptTags
);