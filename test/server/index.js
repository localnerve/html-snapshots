/**
 * Create a local web server for tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const pathm = require("node:path");
const express = require("express");

function setHeaders (res, path) {
  // if we are serving a sitemap.xml.gz, then content-type is application/xml
  if (pathm.extname(path) === ".gz") {
    res.set("content-type", "application/xml");
  }
}

module.exports = {

  start: function (rootDir, port, cb) {
    const server = express();

    server.use(express.static(rootDir, {
      setHeaders: setHeaders
    }));

    const httpServer = server.listen(parseInt(port, 10), function (err) {
      if (cb) {
        cb(err, httpServer);
      }
    });
  }

};
