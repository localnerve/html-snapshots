/*
 * detectors.js
 *
 * A collection of detector functions that detect when a page is ready for a snapshot.
 *
 * The detector functions are run in PhantomJS page.evaluate in the context of a webpage,
 * in a sandboxed execution context.
 * Other special rules apply: http://phantomjs.org/api/webpage/method/evaluate.html
 *
 * The detector functions return true when the page is ready, false if not.
 *
 * This is a module for a phantomJS script that runs in phantomjs.
 *
 * Copyright (c) 2013, 2014, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/* global document, $ */
module.exports = {
  
  // Use plain Web API detection, with standard selectors
  // https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors
  // Returns true on element visibility
  querySelector: function(options) {
    var result = false;
    var el = document.querySelector(options.selector);

    if (el) {
      // el must be an HTMLElement that is visible
      result = el.offsetWidth && el.offsetHeight;
    }
    
    return result;
  },

  // Use JQuery selectors
  // Returns true on element visibility
  jquerySelector: function(options) {
    var result = false;

    if (typeof $ !== "undefined") {
      // the definition of document readiness is visibility
      result = $(options.selector).is(":visible");
    }

    return result;
  }

};