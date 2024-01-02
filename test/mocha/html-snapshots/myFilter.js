/**
 * In-test, custom filter script.
 * Adds a custom tag onto the body.
 *
 * Copyright (c) 2013 - 2024, Alex Grant, LocalNerve, contributors
 */
module.exports = function(content) {
  console.log("IN THE CUSTOMFILTER");
  return content.replace(/<body\b\s*/i, "<body data-someattrZZQy=\"true\" ");
};