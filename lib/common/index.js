/**
 * common code
 *
 */
var fs = require("fs");
var path = require("path");

function _deleteFolderRecursive(p) {
  if(fs.existsSync(p)) {
    fs.readdirSync(p).forEach(function(file,index){
      var curPath = path.join(p, file);
      if(fs.statSync(curPath).isDirectory()) { // recurse
        _deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(p);
  }
}

module.exports = {
  /**
   * ensures that options at least contains propties and values from must
   * if they're not already defined
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
   * simple extend
   */
  extend: function(dest) {
    var sources = Array.prototype.slice.call(arguments, 1);
    for (var s in sources) {
      if (sources[s]) {
        for (var p in sources[s])
          dest[p] = sources[s][p];
      }
    }
    return dest;
  },

  /**
   * simple test for url
   */
   isUrl: function(obj) {
    var result = false;
    if (typeof obj === "string") {
      return (/^https?:\/\//).test(obj);
    }
    return result;
   },

  /**
   * Utility to recursively delete a folder
   */
  deleteFolderRecursive: function(folder) {
    _deleteFolderRecursive(folder);
  }
};