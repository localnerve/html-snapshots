/**
 * browser process specific tests
 * 
 * Copyright (c) 2013 - 2025, Alex Grant, LocalNerve, contributors
 */
const { describe } = require("node:test");
const puppeteer = require("./puppeteer");

describe("browser process tests", () => {
  describe("puppeteer", puppeteer.testSuite());
});