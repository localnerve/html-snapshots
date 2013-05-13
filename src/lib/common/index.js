/**
 * common code
 *
 */
module.exports = {
  /**
   * ensures that options at least contains propties and values from must
   * if they're not already defined
   */
  ensure: function(options, must) {
    if (must) {
      for (var prop in must) {
        if (options[prop] === void 0)
          options[prop] = must[prop];
      }
    }
    return options;
  },

  /**
   * simple extend
   */
  extend: function(dest, source) {
    if (source) {
      for (var prop in source)
        dest[prop] = source[prop];
    }
    return dest;
  },

  /**
   * simple test for url
   */
   isUrl: function(obj) {
    var result = false;
    if (typeof obj === "string") {
      var re = /^https?:\/\//;
      return re.test(obj);
    }
    return result;
   }

};