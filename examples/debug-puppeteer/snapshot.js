/**
 * Debug puppeteer processing of a page on a sample website.
 * 
 * The debug flag applies to all pages, so best to use it to debug one problem page at a time separately.
 * 
 * Copyright (c) 2013 - 2024, Alex Grant, LocalNerve, contributors
 */
const path = require("path");
const util = require("util");
const htmlSnapshots = require("html-snapshots");

htmlSnapshots.run({
  source: [ "https://google.com" ],
  outputDir: path.join(__dirname, "./tmp"),
  outputDirClean: true,
  selector: "body",
  timeout: 60000,
  debug: {
    flag: true,
    slowMo: 2000
  }
})
.then(completed => {
  console.log("completed snapshots:");
  console.log(util.inspect(completed));
})
.catch(error => {
  console.error("error occurred");
  console.error(util.inspect(error));
});