# Examples

+ [Per-page Selectors](#example---per-page-selectors-and-timeouts)
+ [Per-page Output Paths](#example---per-page-special-output-paths)
+ [Per-page jQuery](#example---per-page-selectors-and-jquery)
+ [Array Input](#example---array)
+ [More Array Input](./simple-promise/)
+ [Array Input DRY](./html5rocks/)
+ [Sitemap Index](./sitemap-index/)
+ [Process Limit](./process-limit/)
+ [Script Removal](#example---remote-robotstxt-remove-script-tags-from-html-snapshots)
+ [Custom Filters](./custom/)
+ [Debug PhantomJS w/Verbose Output](./verbose/)
+ [Debug PhantomJS w/Attach](./debug-phantomjs/)
+ [Debug Puppeteer in devtools](./debug-puppeteer/)

### Example - Per page selectors and timeouts
```javascript
const htmlSnapshots = require('html-snapshots');
htmlSnapshots.run({
  input: 'sitemap',
  source: 'https://host.domain/sitemap.xml',
  outputDir: './snapshots',
  outputDirClean: true,
  selector: {
    'https://host.domain/': '#home-content',
    '__default': '#dynamic-content'
  },
  timeout: {
    'https://host.domain/superslowpage/': 20000,
    '__default': 10000
  }
})
.then(completed => {
  // completed is an array of full file paths to the completed snapshots.
})
.catch(error => {
  // error is an Error instance.
  // error.completed is an array of snapshot file paths that were completed.
  // error.notCompleted is an array of file paths that did NOT complete.
});
```
This reads the urls from your sitemap.xml and produces snapshots in the ./snapshots directory. In this example, a selector named "#dynamic-content" appears in all pages across the site except the home page, where "#home-content" appears \(the appearance of a selector in the output triggers the snapshot\). Finally, a default timeout of 10000 ms is set on all pages except http://https://host.domain/superslowpage/, where it waits 20000 ms.

### Example - Per page special output paths
```javascript
const htmlSnapshots = require('html-snapshots');
htmlSnapshots.run({
  input: 'sitemap',
  source: 'https://host.domain/sitemap.xml',
  outputDir: './snapshots',
  outputDirClean: true,
  outputPath: {
    'https://host.domain/services/?page=1': 'services/page/1',
    'https://host.domain/services/?page=2': 'services/page/2'
  },
  selector: '#dynamic-content'
})
.then(completed => {
  // completed is an array of full file paths to the completed snapshots.
})
.catch(error => {
  // error is an Error instance.
  // error.completed is an array of snapshot file paths that were completed.
  // error.notCompleted is an array of file paths that did NOT complete.
});
```
This example implies there are a couple of pages with query strings in sitemap.xml, and we don't want html-snapshots to create directories with query string characters in the names. We would also have a rewrite rule that reflects this same mapping when `_escaped_fragment_` shows up in the querystring of a request so we serve the snapshot from the appropriate directory.

### Example - Per page selectors and jQuery
```javascript
const htmlSnapshots = require('html-snapshots');
htmlSnapshots.run({
  source: '/path/to/robots.txt',
  hostname: 'mysite.com',
  outputDir: './snapshots',
  outputDirClean: true,
  browser: 'phantomjs',
  selector: {
    '__default': '#dynamic-content',
    '/jqpage': 'A-Selector-Not-Supported-By-querySelector'
  },
  useJQuery: {
    '/jqpage': true,
    '__default': false
  }
})
.then(completed => {
  // completed is an array of full file paths to the completed snapshots.
})
.catch(error => {
  // error is an Error instance.
  // error.completed is an array of snapshot file paths that were completed.
  // error.notCompleted is an array of file paths that did NOT complete.
});
```
This reads the urls from your robots.txt and produces snapshots in the ./snapshots directory. In this example, a selector named "#dynamic-content" appears in all pages across the site except in "/jqpage", where a selector not supported by [querySelector](https://developer.mozilla.org/en-US/docs/Web/API/document.querySelector) is used. Further, "/jqpage" loads jQuery itself \(required\). All the other pages don't need to use special selectors, so the default is set to `false`. Notice that since a robots.txt input is used, full URLs are **not** used to match selectors. Instead, paths \(and QueryStrings and any Hashes\) are used, just as specified in the robots.txt file itself.

### Example - Array
```javascript
const htmlSnapshots = require('html-snapshots');
htmlSnapshots.run({
  input: 'array',
  source: ['http://mysite.com', 'http://mysite.com/contact', 'http://mysite.com:82/special'],
  outputDir: './snapshots',
  outputDirClean: true,  
  selector: '#dynamic-content'
})
.then(completed => {
  // completed is an array of full file paths to the completed snapshots.
})
.catch(error => {
  // error is an Error instance.
  // error.completed is an array of snapshot file paths that were completed.
  // error.notCompleted is an array of file paths that did NOT complete.
});
```
Generates snapshots for "/", "/contact", and "/special" from mysite.com. "/special" uses port 82. All use http protocol. Array input can be powerful, check out a [simple example](/examples/simple-promise), or a more [complex example](/examples/html5rocks).

### Example - Remote robots.txt, remove script tags from html snapshots
```javascript
const assert = require('assert');
const fs = require('fs');
const htmlSnapshots = require('html-snapshots');

htmlSnapshots.run({
  source: 'http://localhost/robots.txt',
  outputDir: './snapshots',
  outputDirClean: true,  
  selector: '#dynamic-content',
  snapshotScript: {
    script: 'removeScripts'
  }
})
.then(completed => {
  completed.forEach(snapshotFile => {
    const content = fs.readFileSync(snapshotFile, { encoding: 'utf8'});
    assert.equal(false, /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content));
  });
  // It didn't throw b/c there are no script tags in the html snapshots
  console.log('stripped all script tags as expected');
})
.catch(error => {
  // error is an Error instance.
  // error.completed is an array of snapshot file paths that were completed.
  // error.notCompleted is an array of file paths that did NOT complete.
});
```
Removes all script tags from the output of the html snapshot. Custom filters are also supported, see the customFilter Example in the explanation of the `snapshotScript` option. Also, check out the concrete [example](/examples/custom).
