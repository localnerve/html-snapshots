/**
 * Common module tests.
 *
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const createServer = require("../../server/index.js");
const common = require("../../../lib/common/index.js");

const port = 9039;

describe("common", () => {

  describe("ensure", () => {

    it("should return the options if no defaults specified", () => {
      const options = { one: "one", two: "two", three: "three" };
      const result = common.ensure(options);
      assert.equal(result.toString(), options.toString());
    });

    it("should return the result options", () => {
      const defaults = { one: "two", two: "three", three: "four" };
      const options = { one: "one", two: "two", three: "three" };
      const result = common.ensure(options, defaults);
      assert.equal(result.toString(), options.toString());
    });

    it("should not copy defaults when specified in options", () => {
      const defaults = { one: "two", two: "three", three: "four" };
      const options = { one: "one", two: "two", three: "three" };
      common.ensure(options, defaults);
      assert.equal("one", options.one);
      assert.equal("two", options.two);
      assert.equal("three", options.three);
    });

    it("should copy defaults when not specified in options", () => {
      const defaults = { one: "two", two: "three", three: "four" };
      const options = { one: "one", two: "two" };
      common.ensure(options, defaults);
      assert.equal("one", options.one);
      assert.equal("two", options.two);
      assert.equal("four", options.three);
    });
  });

  describe("isUrl", () => {

    it("should detect an http url", () => {
      const result = common.isUrl("http://whatever.com/");
      assert.equal(result, true);
    });

    it("should not detect a file", () => {
      const result = common.isUrl(path.join(__dirname, __filename));
      assert.equal(result, false);
    });

    it("should not detect an object", () => {
      const result = common.isUrl({ url: "bogus" });
      assert.equal(result, false);
    });
  });

  describe("isObject", () => {

    it("should detect a simple object", () => {
      const result = common.isObject({});
      assert.equal(result, true);
    });

    it("should fail for null", () => {
      const result = common.isObject(null);
      assert.equal(result, false);
    });

    it("should fail for function object", () => {
      const result = common.isObject(() => {});
      assert.equal(result, false);
    });
  });

  describe("isFunction", () => {

    it("should detect a simple function", () => {
      const result = common.isFunction(() => {});
      assert.equal(result, true);
    });

    it("should fail for an object", () => {
      const result = common.isFunction({});
      assert.equal(result, false);
    });

    it("should fail for null", () => {
      const result = common.isFunction(null);
      assert.equal(result, false);
    });
  });

  describe("once", () => {

    it("should only run a function once", () => {
      let counter = 0;
      const subject = () => { counter++; };
      const oncer = common.once(subject);
      oncer();
      oncer();
      oncer();
      assert.equal(counter, 1);
    });

    it("should not run a function if not called", () => {
      let counter = 0;
      const subject = () => { counter++; };
      common.once(subject);
      assert.equal(counter, 0);
    });

    it("should preserve this if bound", () => {
      const context = {
        count: 0,
        fn () {
          this.count++;
        }
      };
      const oncer = common.once(context.fn.bind(context));
      oncer();
      oncer();
      oncer();
      assert.equal(context.count, 1);
    });

    it("should have tear-off instances of onceWrapper that act independently", () => {
      const contextOne = {
        count: 0,
        fn () {
          this.count++;
        }
      };
      const contextTwo = {
        count: 0,
        fn () {
          this.count++;
        }
      };
      assert.equal(contextOne.count, 0);
      const oneOnce = common.once(contextOne.fn.bind(contextOne));
      const twoOnce = common.once(contextTwo.fn.bind(contextTwo));
      oneOnce();
      oneOnce();
      oneOnce();
      assert.equal(contextOne.count, 1);
      assert.equal(contextTwo.count, 0);
      twoOnce();
      twoOnce();
      twoOnce();
      assert.equal(contextTwo.count, 1);
    });
  });

  describe("head", () => {

    it("should get the first element of an array", () => {
      const target = "one";
      const ar = [target, "two"];
      const result = common.head(ar);
      assert.equal(result, target);
    });

    it("should return undefined if empty array", () => {
      const ar = [];
      const result = common.head(ar);
      assert.equal(result, undefined);
    });

    it("should return undefined if given undefined", () => {
      let ar = undefined;
      const result = common.head(ar);
      assert.equal(result, undefined);
    })
  });

  describe("parseUrl", () => {
    const proto = "https:";
    const hostname = "muh.host";
    const port = "1212";
    const pathname = "/im/a/path";
    const search = "?wazz=up";
    const hash = "#hash";
    const user = "user";
    const pass = "pass";
    let fullUrl;
    let relUrl;
    let protoRel;
    let noisyUrl;
    let brokenUrl;

    before(() => {
      fullUrl = `${proto}//${user}:${pass}@${hostname}:${port}${pathname}${search}${hash}`;
      relUrl = `${pathname}${search}${hash}`;
      protoRel = `//${hostname}${pathname}`;
      brokenUrl = `http\n\t://${hostname}:foo`;
      noisyUrl = `${proto.slice(0, -1)}\n\t://${hostname}:${port}`;
    });

    it("should parse url string to url object", () => {
      const url = common.parseUrl(fullUrl);
      assert.ok(url instanceof URL);
      assert.strictEqual(url.protocol, proto);
      assert.strictEqual(url.hostname, hostname);
      assert.strictEqual(url.port, port);
      assert.strictEqual(url.pathname, pathname);
      assert.strictEqual(url.search, search);
      assert.strictEqual(url.hash, hash);
      assert.strictEqual(url.username, user);
      assert.strictEqual(url.password, pass);
      assert.strictEqual(url.auth, `${url.username}:${url.password}`);
    });

    it("should parse a relative url", () => {
      const url = common.parseUrl(relUrl);
      assert.ok(url instanceof URL);
      assert.strictEqual(url.pathname, pathname);
      assert.strictEqual(url.hostname, "");
      assert.strictEqual(url.search, search);
      assert.strictEqual(url.hash, hash);
    });

    it("should parse a protocol relative url", () => {
      const url = common.parseUrl(protoRel);
      assert.ok(url instanceof URL);
      assert.strictEqual(url.hostname, hostname);
      assert.strictEqual(url.pathname, pathname);
    });

    it("should parse a broken url as legacy", () => {
      const url = common.parseUrl(brokenUrl);
      assert.ok(url instanceof URL === false);
      assert.ok(url.path);
    });

    it("should parse a noisy url", () => {
      const url = common.parseUrl(noisyUrl);
      assert.ok(url instanceof URL);
      assert.strictEqual(url.protocol, proto);
      assert.strictEqual(url.hostname, hostname);
      assert.strictEqual(url.port, port);
    });
  });

  describe("prependMsgToErr", () => {

    it("should return undefined if given falsy error", () => {
      const result = common.prependMsgToErr(undefined, "message", true);

      assert.equal(result, undefined);
    });

    it("should return same error if given error and no message", () => {
      // These need to have the same message.
      const error = new Error("my test error");
      const input = new Error("my test error");

      const result = common.prependMsgToErr(input);

      assert.deepEqual(result, error);
    });

    it("should quote the message when asked", () => {
      const msg = "my message";
      const result = common.prependMsgToErr(new Error("my test error"), msg, true);

      assert.equal(result.message.indexOf("'"+msg+"'") > -1, true);
    });

    it("should not quote a message when asked", () => {
      const msg = "my message";
      const result = common.prependMsgToErr(new Error("my test error"), msg);

      assert.equal(result.message.indexOf("'"+msg+"'") === -1, true);
      assert.equal(result.message.indexOf(msg) > -1, true);
    });

    it("should make an error if string was given", () => {
      const input = "my test error";
      const msg = "my message";
      const result = common.prependMsgToErr(input, msg, true);

      assert.equal(result instanceof Error, true);
      assert.equal(result.message.indexOf("'"+msg+"'") > -1, true);
    });

    it("should prepend message to error", () => {
      const msg = "my message";
      const errMsg = "my test error";
      const result = common.prependMsgToErr(new Error(errMsg), msg);

      const resultMessage = result.message.split(": ");

      assert.equal(resultMessage.length > 1, true);
      assert.equal(resultMessage[0], msg);
      assert.equal(resultMessage[1], errMsg);
    });
  });

  describe("checkResponse", () => {

    function makeHeaders (contentType) {
      const headers = contentType ? { "Content-Type": contentType } : {};
      return new Headers({
        ...headers
      });
    }
    it("should reject a non 200 response", () => {
      const result = common.checkResponse({ status: 206 }, "doesntmatter");
      assert.notEqual(false, result);
    });

    it("should reject for missing content type", () => {
      const result = common.checkResponse({
        status: 200,
        headers: makeHeaders()
      }, "any");
      assert.notEqual(false, result);
    });

    it("should reject for bad content type, single", () => {
      const result = common.checkResponse({
        status: 200,
        headers: makeHeaders("text/plain")
      }, "text/xml");
      assert.notEqual(false, result);
    });

    it("should reject for bad content type, multiple", () => {
      const result = common.checkResponse({
        status: 200,
        headers: makeHeaders("text/plain")
      }, ["text/xml", "application/xml"]);
      assert.notEqual(false, result);
    });

    it("should accept for good content type, single", () => {
      const contentType = "text/plain";
      const result = common.checkResponse({
        status: 200,
        headers: makeHeaders(contentType)
      }, contentType);
      assert.equal(false, result);
    });

    it("should accept for good content type, multiple, first", () => {
      const contentType = "text/xml";
      const result = common.checkResponse({
        status: 200,
        headers: makeHeaders(contentType)
      }, [contentType, "application/xml"]);
      assert.equal(false, result);
    });

    it("should accept for good content type, multiple, last", () => {
      const contentType = "text/xml";
      const result = common.checkResponse({
        status: 200,
        headers: makeHeaders(contentType)
      }, ["application/xml", contentType]);
      assert.equal(false, result);
    });
  });

  describe("simpleFetch", () => {
    let server;
    const localhost = `http://localhost:${port}`;
    const path500 = "/path500";
    let reqCount = 0;
    const pathRecover = "/path500recover";

    before(async () => {
      server = createServer([{
        path: path500,
        handler: (req, res) => {
          res.status(500).send("error");
        }
      }, {
        path: pathRecover,
        handler: (req, res) => {
          if (reqCount > 1) {
            res.status(200).send("success");
          } else {
            res.status(500).send("error");
          }
          reqCount++;
        }
      }]);
      await server.start(path.join(__dirname, "./server"), port);
    });

    after(async () => {
      await server.stop();
    });

    it("should get a simple document", async () => {
      const response = await common.get(localhost);
      assert.ok(response.ok);
    });

    it("should fail not found as expected", async () => {
      const response = await common.get(`${localhost}/notfound`);
      assert.ok(!response.ok);
      assert.strictEqual(response.status, 404);
    });

    it("should fail five hundred as expected", async () => {
      const response = await common.get(`${localhost}${path500}`);
      assert.ok(!response.ok);
      assert.strictEqual(response.status, 500);
    });

    it("should handle failure and recovery as expected", async () => {
      const response = await common.get(`${localhost}${pathRecover}`);
      assert.ok(response.ok);
    });
  });
});
