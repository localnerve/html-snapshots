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
var selectorIsVisible = require("./modules/selectorIsVisible");
var cli = require("./modules/cli");

/**
 * Remove all script tags from content
 */
function removeScriptTags(content) {
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

var options = cli.selector();
selectorIsVisible(options, removeScriptTags);