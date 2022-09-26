/**
 * browser process specific tests
 * 
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
/* global describe */
const puppeteer = require("./puppeteer");

describe("browser process tests", function () {
  describe("puppeteer", puppeteer.testSuite());
});