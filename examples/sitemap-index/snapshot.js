/*
 * Simple page snapshots example.
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 *
 * Use sitemap index to drive input to snapshot individual pages.
 */
var htmlSnapshots = require('html-snapshots');
var utils = require("../utils");

// where the snapshots go
var outputDir = require('path').join(__dirname, './tmp');

// If you want to crawl a huge map:
// 'https://www.usgs.gov/sitemap.xml',

// Do it:
htmlSnapshots.run({
  input: 'sitemap-index',
  source: 'http://bestplacestowork.org/sitemap_index.xml', 
  outputDir: outputDir,
  outputDirClean: true,
  selector: 'body',
  timeout: 60000
})
.then(function (completed) {
  console.log('completed #', completed.length);
  console.log('completed snapshots:');
  console.log(require('util').inspect(completed));
})
.catch(function (err) {
  console.error('completed #', err.completed.length);
  console.error('not completed #', err.notCompleted.length)
  console.error(err);
  utils.cleanupAndExit(true);
});
