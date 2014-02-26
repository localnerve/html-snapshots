/**
 * common code
 *
 */
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
        if (options[prop] === void 0 || options[prop] === null)
          options[prop] = must[prop];
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
  }
};