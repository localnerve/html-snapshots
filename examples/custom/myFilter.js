/*
 * Example custom filter for html-snapshots
 *
 * Processes the snapshot output before it is finalized.
 */
module.exports = function(content) {
  var filterVersion = "1.0-20141123";

  return content
    // remove all script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // remove all meta tags
    .replace(/<meta\s.*?(\/)?>/gi, "")
    // remove all link tags
    .replace(/<link\s.*?(\/)?>/gi, "")
    // replace select words
    .replace(/\bWordpress\b/ig, "myReplacement")
    // add an attribute to the body for tracking and identification
    .replace(/<body\b/i, "<body data-snapshot-filter=\""+filterVersion+"\" ")
    ;
};