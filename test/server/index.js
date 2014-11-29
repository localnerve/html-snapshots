/**
 * Create a local web server for tests
 */
var pathm = require("path");
var express = require("express");

var server = express();

function setHeaders(res, path) {
  // if we are serving a sitemap.xml.gz, then content-type is application/xml
  if (pathm.extname(path) === ".gz") {
    res.set("content-type", "application/xml");
  }
}

module.exports = {

  start: function(rootDir, port) {
    server.use(express.static(rootDir, {
      setHeaders: setHeaders
    }));
    server.listen(parseInt(port, 10));
  }

};