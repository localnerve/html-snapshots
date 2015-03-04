/**
 * common code
 *
 */
/* jshint bitwise: false */
 var _ = require("lodash");

module.exports = {
  /**
   * Ensures that options at least contains propties and values from must
   * if they're not already defined and not null.
   * Differs from underscore by replacing
   *   undefined *or null* falsies, and only one defaults source allowed.
   */
  ensure: function(options, must) {
    if (must) {
      for (var prop in must) {
        if (options[prop] === void 0 || options[prop] === null) {
          options[prop] = must[prop];
        }
      }
    }
    return options;
  },

  /**
   * simple test for url
   * If you can think of a more approriate test for this use case, 
   *   please let me know in the issues...
   */
  isUrl: function(obj) {
    var result = false;
    if (typeof obj === "string") {
      return (/^https?:\/\//).test(obj);
    }
    return result;
  },

  /**
   * Simple response checker for remote files.
   * Expected use in robots.txt or sitemap.xml only.
   *
   *   res is IncomingMessage.
   *   mediaTypes is an array of acceptable content-type media type strings.
   *
   *   Returns falsy if ok, error message otherwise.
   */  
  checkResponse: function(res, mediaTypes) {
    var contentTypeOk,
        result = "status: '" + res.statusCode + "', GET failed.";

    mediaTypes = !_.isArray(mediaTypes) ? [mediaTypes] : mediaTypes;
    
    if (res.statusCode === 200) {
      // if content-type exists, and media type found then contentTypeOk
      contentTypeOk = 
        res.headers["content-type"] &&
        // empty array and none found return true
        !mediaTypes.every(function(mediaType) {
          // flip -1 to 0 and NOT, so that true == NOT found, found stops loop w/false          
          return !~res.headers["content-type"].indexOf(mediaType);
        });

      result = contentTypeOk ? false : "content-type not one of '"+mediaTypes.join(",")+"'";
    }

    return result;
  }

};