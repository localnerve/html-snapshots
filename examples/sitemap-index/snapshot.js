/*
 * Simple page snapshots example.
 * Copyright (c) 2013 - 2017, Alex Grant, LocalNerve, contributors
 *
 * Use sitemap index to drive input to snapshot individual pages.
 */
var spawn = require('child_process').spawn;
var htmlSnapshots = require('html-snapshots');

// where the snapshots go
var outputDir = require('path').join(__dirname, './tmp');

var failure = false;

// Do it:
htmlSnapshots.run({
  input: 'sitemap-index',
  source: 'https://core.codekraft.it/public/wordpress/sitemap_index.xml',
  outputDir: outputDir,
  outputDirClean: true,
  selector: '.content',
  timeout: 60000
})
.then(function (completed) {
  console.log('completed snapshots:');
  console.log(require('util').inspect(completed));
})
.catch(function (err) {
  console.error('failure', err);
  failure = true;
})
.then(function () {
  var pkill;

  if (failure) {
    if (process.platform === 'win32') {
      process.exit(0);
    } else {
      // kill any lingering phantomjs processes
      pkill = spawn('pkill', ['^phantomjs$']);
      pkill.on('exit', function () {
        process.exit(0);
      });
    }
  }
});
