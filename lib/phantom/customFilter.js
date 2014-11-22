/*
 * customFilter.js
 *
 * Produce a single snapshot for a web page.
 * Snapshot taken when selector is(:visible).
 * Applies a custom filter to the snapshot output.
 *
 * This is a phantomJS script that runs in phantomjs.
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
var selectorDetect = require("./modules/selectorDetect");
var cli = require("./modules/cli");
var detectors = require("./modules/detectors");

var options = cli.selector();
var customFilter = require(options.module);

selectorDetect(
  options, 
  options.useJQuery ? detectors.jquerySelector : detectors.querySelector, 
  customFilter
);