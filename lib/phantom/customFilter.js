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
var selectorIsVisible = require("./modules/selectorIsVisible");
var cli = require("./modules/cli");

var options = cli.selector();
var customFilter = require(options.module);

selectorIsVisible(options, customFilter);