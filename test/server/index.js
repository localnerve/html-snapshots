/**
 * Create a local web server for tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const pathm = require("node:path");
const { promisify } = require("node:util");
const express = require("express");
const enableDestroy = require("server-destroy");

function setHeaders (res, path) {
  // if we are serving a sitemap.xml.gz, then content-type is application/xml
  if (pathm.extname(path) === ".gz") {
    res.set("content-type", "application/xml");
  }
}

class LocalServer {
  constructor (routes = null) {
    this._app = express();
    this._server = null;
    this._routes = routes;
  }

  async start (path, port = 0) { // 0 = pick random port number
    await this.stop();

    this._app.use("/", express.static(path, {
      setHeaders
    }));

    if (this._routes && this._routes.length > 0) {
      for (const route of this._routes) {
        this._app.use(route.path, route.handler);
      }
    }

    return new Promise((resolve, reject) => {
      this._server = this._app.listen(port, err => {
        if (err) return reject(err);
        enableDestroy(this._server);
        resolve(this._server.address().port);
      });
    });
  }

  stop () {
    if (this._server) {
      const server = this._server;
      this._server = null;

      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        const destroy = promisify(server.destroy);
        try {
          await destroy();
        } catch (error) {
          return reject(error);
        }
        setTimeout(resolve, 10);
      });
    }
    return Promise.resolve();
  }
}

function createServer (routes = null) {
  return new LocalServer(routes)
}

module.exports = createServer;
