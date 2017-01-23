/*
 * Simple page snapshots example.
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 *
 * Use sitemap index to drive input to snapshot individual pages.
 */
var htmlSnapshots = require('html-snapshots');
var utils = require("../utils");

// where the snapshots go
var outputDir = require('path').join(__dirname, './tmp');

// Do it:
htmlSnapshots.run({
  input: 'sitemap-index',
  source: 'https://tech.jet.com/sitemap_index.xml',
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
