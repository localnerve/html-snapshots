/**
 * common code
 *
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
"use strict";

module.exports = {
  /**
   * Ensures that options at least contains propties and values from must
   * if they're not already defined and not null.
   * Differs from underscore by replacing
   *   undefined *or null* falsies, and only one defaults source allowed.
   */
  ensure: function (options, must) {
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
  isUrl: function (obj) {
    var result = false;
    if (typeof obj === "string") {
      return (/^https?:\/\//).test(obj);
    }
    return result;
  },

  /**
   * Prepend a message to an Error message.
   *
   * @param {Object} [error] - An instance of Error. If not, converted to Error.
   * If undefined, then pass through undefined.
   * @param {String} [message] - The message to prepend.
   * @param {Boolean} [quoteInput] - True if the message should be quoted.
   * @returns {Error} The updated Error instance, undefined if no error.
   */
  prependMsgToErr: function (error, message, quoteInput) {
    var result, prepend, empty = "", quote = "'";

    if (error) {
      if (message) {
        prepend = quoteInput ? empty.concat(quote, message, quote) : message;
      }

      // Force Error instance, coerce given error to a string
      error = error instanceof Error ? error : new Error(empty + error);

      // If message supplied, prepend it
      error.message =
        prepend ? empty.concat(prepend, ": ", error.message) : error.message;

      result = error;
    }

    return result;
  },

  /**
   * Simple response checker for remote files.
   * Expected use in robots.txt or sitemap.xml only.
   *
   * @param {IncomingMessage} res - The IncomingMessage response to check.
   * @param {Array} mediaTypes - array of acceptable content-type media type strings.
   * @returns {String} Error message, empty string (falsy) if OK.
   */
  checkResponse: function (res, mediaTypes) {
    var contentTypeOk,
        result = "status: '" + res.statusCode + "', GET failed.";

    mediaTypes = !Array.isArray(mediaTypes) ? [mediaTypes] : mediaTypes;

    if (res.statusCode === 200) {
      // if content-type exists, and media type found then contentTypeOk
      contentTypeOk =
        res.headers["content-type"] &&
        // empty array and none found return true
        !mediaTypes.every(function(mediaType) {
          // flip -1 to 0 and NOT, so that true == NOT found, found stops loop w/false
          return !~res.headers["content-type"].indexOf(mediaType);
        });

      result = contentTypeOk ? "" : "content-type not one of '"+mediaTypes.join(",")+"'";
    }

    return result;
  }

};
