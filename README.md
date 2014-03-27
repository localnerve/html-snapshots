# [html-snapshots v0.4.2](http://github.com/localnerve/html-snapshots)
[![Build Status](https://secure.travis-ci.org/localnerve/html-snapshots.png?branch=master)](http://travis-ci.org/localnerve/html-snapshots)
> Takes html snapshots of your site's crawlable pages when a selector becomes visible.

## Overview
html-snapshots is a flexible html snapshot library that uses PhantomJS to take html snapshots of your webpages served from your site. A snapshot is only taken when a specified selector is detected visible in the output html. This tool is useful when your site is largely ajax content, or an SPA, and you want your dynamic content indexed by search engines.

html-snapshots gets urls to process from either a robots.txt or sitemap.xml. Alternatively, you can supply an array with completely arbitrary urls, or a line delimited textfile with arbitrary host-relative paths.

html-snapshots processes all the urls in parallel in their own PhantomJS processes. 
**UPDATE** Starting with version 0.3.0, you can limit the number of PhantomJS processes that will ever run at once with the `processLimit` option.

## Feedback
Please [let me know how you are using this library](http://www.localnerve.com/blog/how-are-you-using-html-snapshots/) so I can make sure it evolves appropriately.

## More Information
Here are some [background and other notes](http://github.com/localnerve/html-snapshots/blob/master/docs/notes.md) regarding this project.

## Getting Started
This library requires PhantomJS '>=1.7.1'. As of 0.3.0, works with 1.9.7.

### Installation
The simplest way to install html-snapshots is to use [npm](http://npmjs.org), just `npm
install html-snapshots` will download html-snapshots and all dependencies.

### Grunt Task
If you are interested in the grunt task that uses this library, check out [grunt-html-snapshots](http://github.com/localnerve/grunt-html-snapshots).

## Example Usage
If you are looking for a more in-depth usage example, here is [an article](http://github.com/localnerve/html-snapshots/blob/master/docs/example-heroku-redis.md) that includes explanation and code of a real usage featuring dynamic app routes, ExpressJS, Heroku, and more.

### Simple example
```javascript
var htmlSnapshots = require('html-snapshots');
var result = htmlSnapshots.run({
  source: "/path/to/robots.txt",
  hostname: "exampledomain.com",
  outputDir: "./snapshots",
  outputDirClean: true,
  selector: "#dynamic-content"
});
// result === true if snapshots were successfully started
```
This reads the urls from your robots.txt and produces snapshots in the ./snapshots directory. In this example, a selector named "#dynamic-content" appears in all pages across the site. Once this selector is visible in a page, the html snapshot is taken.

### Example - Per page selectors and timeouts
```javascript
var htmlSnapshots = require('html-snapshots');
var result = htmlSnapshots.run({
  input: "sitemap",
  source: "/path/to/sitemap.xml",
  outputDir: "./snapshots",
  outputDirClean: true,
  selector: { "http://mysite.com": "#home-content", "__default": "#dynamic-content" },
  timeout: { "http://mysite.com/superslowpage", 6000, "__default": 5000 }
});
// result === true if snapshots were successfully started
```
This reads the urls from your sitemap.xml and produces snapshots in the ./snapshots directory. In this example, a selector named "#dynamic-content" appears in all pages across the site except the home page, where "#home-content" appears (the appearance of a selector in the output indicates that the page is ready for a snapshot). Also, html-snapshots uses the default timeout (5000 ms) on all pages except http://mysite.com/superslowpage, where it waits 6000 ms.

### Example - Per page special output paths
```javascript
var htmlSnapshots = require('html-snapshots');
var result = htmlSnapshots.run({
  input: "sitemap",
  source: "/path/to/sitemap.xml",
  outputDir: "./snapshots",
  outputDirClean: true,
  outputPath: { "http://mysite.com/services/?page=1": "services/page/1", "http://mysite.com/services/?page=2": "services/page/2" },
  selector: "#dynamic-content"
});
// result === true if snapshots were successfully started
```
This example implies there are a couple of pages with query strings in sitemap.xml, and we don't want html-snapshots to create directories with query string characters in the names. We would also have to have a rewrite rule that reflects this same mapping when `_escaped_fragment_` shows up in the querystring of a request so we serve the snapshot from the appropriate directory.

### Example - Array
```javascript
var htmlSnapshots = require('html-snapshots');
var result = htmlSnapshots.run({
  input: "array",
  source: ["http://mysite.com", "http://mysite.com/contact", "http://mysite.com:82/special"],
  outputDir: "./snapshots",
  outputDirClean: true,  
  selector: "#dynamic-content"
});
// result === true if snapshots were successfully started
```
Generates snapshots for "/", "/contact", and "/special" from mysite.com. "/special" uses port 82. All use http protocol.

### Example - Completion callback, Remote robots.txt
```javascript
var htmlSnapshots = require('html-snapshots');
var result = htmlSnapshots.run({
  input: "robots",      // default, so not required
  source: "http://localhost/robots.txt",
  hostname: "localhost",
  outputDir: "./snapshots",
  outputDirClean: true,  
  selector: "#dynamic-content"
}, function(err, snapshotsCompleted) { 
  /* 
    Do something when html-snapshots has completed.

    err is undefined if all snapshots were generated successfully.

    snapshotsCompleted is an array of normalized paths to output files that 
      contain completed snapshots.
    If no snapshots are completed, this is an empty array.

    You can use snapshotsCompleted to populate shared storage if you are running
      in a scalable server environment with an ephemeral file system:
  */
  if (typeof err === "undefined") {
    // safe to use snapshotsCompleted to update alternative storage
    //   Example: https://github.com/localnerve/wpspa/blob/master/server/workers/snapshots/lib/index.js
  }  
});
```
Generates snapshots in the ./snapshots directory for paths found in http://localhost/robots.txt. Uses those paths against "localhost" to get the actual html output. Expects "#dynamic-content" to appear in all output. The callback function is called when snapshots concludes.

## Options
Apart from the default settings, there are a number of options that can be specified. Options are specified in an object to the module's run method ``htmlSnapshots.run({ optionName: value })``.

+ `input` 
  + default: `"robots"`
  + Specifies the input generator to be used to produce the urls. 
      
      Possible *values*:
      
      `"sitemap"` Supply urls from a local or remote sitemap.xml file.      
      `"robots"` Supply urls from a local or remote robots.txt file. Robots.txt files with wildcards are NOT supported - Use "sitemap" instead.      
      `"textfile"` Supply urls from a local line-oriented text file in the style of robots.txt      
      `"array"`, supply arbitrary urls from a javascript array.

+ `source`
  + default: `"./robots.txt"`, `"./sitemap.xml"`, `"./line.txt"`, or `[]`, depending on the input generator.
  + Specifies the input source. This must be a valid location of a robots.txt, sitemap.xml, or a textfile or the associated input generators. robots.txt and sitemap.xml can be local or remote. However, for the array input generator, this must be a javascript array of urls.
+ `sitemapPolicy`
  + default: `false`
  + For use only with the sitemap input generator. When true, lastmod and/or changefreq sitemap url child elements can be used to determine if a snapshot needs to be taken. Here are the possibilities for usage:
    + Both lastmod and changefreq tags are specifed alongside loc tags in the sitemap. In this case, both of these tags are used to determine if the url is out-of-date and needs a snapshot.
    + Only a lastmod tag is specified alongside loc tags in the sitemap. In this case, if an output file from a previous run is found for the url loc, then the file modification time is compared against the lastmod value to see if the url is out-of-date and needs a snapshot.
    + Only a changefreq tag is specified alongside loc tags in the sitemap. In this case, if an output file from a previous run is found for the url loc, then the last file modification time is used as a timespan \(from now\) and compared against the given changefreq to see if the url is out-of-date and needs a snapshot.
  
  Not all url elements in a sitemap have to have lastmod and/or changefreq \(those tags are optional, unlike loc\), but the urls you want to be able to skip \(if they are current\) must make use of those tags. You can intermix usage of these tags, as long as the requirements are met for making an age determination. If a determination on age cannot be made for any reason, the url is processed normally. For more info on sitemap tags and acceptable values, read the [wikipedia](http://en.wikipedia.org/wiki/Sitemaps) page.
+ `hostname`
  + default: `"localhost"`
  + Specifies the hostname to use for paths found in a robots.txt or textfile. Applies to all pages. This option is ignored if you are using the sitemap or array input generators.
+ `port`
  + default: 80
  + Specifies the port to use for all paths found in a robots.txt or textfile. This option is ignored if you are using the sitemap or array input generators.
+ `auth`
  + default: none
  + Specifies the old-school authentication portion of the url. Applies to all path found in a robots.txt or textfile.
+ `protocol`
  + default: `"http"`
  + Specifies the protocol to use for all paths found in a robots.txt or textfile. This option is ignored if you are using the sitemap or array input generators.
+ `outputDir`
  + default: none
  + **Required** \(you must specify a value\). Specifies the root output directory to put all the snapshot files in. Paths to the snapshot files in the output directory are defined by the paths in the urls themselves. The snapshot files are always named "index.html".
+ `outputDirClean`
  + default: `false`
  + Specifies if html-snapshots should clean the output directory before it creates the snapshots. If you are using sitemapPolicy and only specifying one of lastmod or changefreq in your sitemap \(thereby relying on file modification times on output files from a previous run\) this value must be false.
+ `outputPath`
  + default: none
  + Specifies per url overrides to the generated snapshot output path. The default output path for a snapshot file is rooted at outputDir, but is simply an echo of the input path - plus any arguments. Depending on your urls, your `_escaped_fragment_` rewrite rule (see below), or the characters allowed in directory names in your environment, it might be necessary to use this option to change the output paths.

      The value can be one of these *javascript types*:

      `"object"` If the value is an object, it must be a key/value pair object where the key must match the url (or path in the case of robots.txt style) found by the input generator.
      `"function"` If the value is a function, it is called for every page and passed a single argument that is the url (or path in the case of robots.txt style) found in the input.

  Notes: For pretty urls, this option may not be wanted/needed. The output file name is always "index.html".

+ `selector`
  + default: `"body"`
  + Specifies the selector to find in the output before taking the snapshot. The appearence of this selector defines a page's readiness for a snapshot. 
      
      The value can be one of these *javascript types*:
      
      `"string"` If the value is a string, it is used for every page.       
      `"object"` If the value is an object, it is interpreted as key/value pairs where the key must match the url (or path in the case of robots.txt style) found by the input generator. This allows you to specify selectors for individual pages. The reserved key "__default" allows you to specify the default selector so you don't have to specify a selector every individual page.
      
      `"function"` If the value is a function, it is called for every page and passed a single argument that is the url (or path in the case of robots.txt style) found in the input.

+ `timeout`
  + default: 5000 (milliseconds)
  + Specifies the time to wait for the selector to become visible.
      
      The value can be of these one of these *javascript types*:
      
      `"number"` If the value is a number, it is used for every page in the website.      
      `"object"` If the value is an object, it is interpreted as key/value pairs where the key must match the url (or path in the case of robots.txt style) found by the input generator. This allows you to specify timeouts for individual pages. The reserved key "__default" allows you to specify the default timeout so you don't have to specify a timeout for every individual page.
      
      `"function"` If the value is a function, it is called for every page and passed a single argument that is the url (or path in the case of robots.txt style) found in the input.

+ `processLimit`
  + default: Number.MAX_VALUE
  + Limits the number of child PhantomJS processes that can ever be actively running in parallel. A value of 1 effectively forces the snapshots to be taken in series (only one at a time). Useful if you need to limit the number of processes spawned by this library.
+ `checkInterval`
  + default: 250 (milliseconds)
  + Specifies the rate at which the PhantomJS script checks to see if the selector is visible yet. Applies to all pages.
+ `pollInterval`
  + default: 500 (milliseconds)
  + Specifies the rate at which html-snapshots checks to see if a PhantomJS script has completed. Applies to all pages.
+ `snapshotScript`
  + default: this library's phantom/snapshotSingle.js file
  + Specifies the PhantomJS script to run to actually produce the snapshot. Override this if you need to supply your own snapshot script. This script is run per url (or path) by html-snapshots in a separate PhantomJS process. Applies to all pages.
+ `phantomjs`
  + default: A package local reference to phantomjs.
  + Specifies the phantomjs executable to run. Override this if you want to supply a path to a different version of phantomjs. To reference PhantomJS globally in your environment, just use the value, "phantomjs". Remember, it must be found in your environment path to execute.
See [PhantomJS](http://phantomjs.org/) for more information.

## Example Rewrite Rule
Here is an example apache rewrite rule for rewriting \_escaped\_fragment\_ requests to the snapshots directory on your server.
```
<ifModule mod_rewrite.c>
  RewriteCond %{QUERY_STRING} ^_escaped_fragment_=(.*)$
  RewriteCond %{REQUEST_URI} !^/snapshots [NC]
  RewriteRule ^(.*)/?$ /snapshots/$1 [L]
</ifModule>
```
This serves the snapshot to any request for a url (perhaps found by a bot in your robots.txt or sitemap.xml) to the snapshot output directory. In this example, no translation is done, it simply takes the request as is and serves its corresponding snapshot. So a request for `http://mysite.com/?_escaped_fragment_=` serves the mysite.com homepage snapshot.

You can also refer `_escaped_fragment_` requests to your snapshots in ExpressJS with a similar method using [connect-modrewrite](https://github.com/tinganho/connect-modrewrite) middleware. Here is an analogous example of a connect-modrewrite rule:
```javascript
  '^(.*)\\?_escaped_fragment_=.*$ /snapshots/$1 [NC L]'
```

Another ExpressJS middleware example using html-snapshots can be found at [wpspa/server/middleware/snapshots.js](https://github.com/localnerve/wpspa/blob/master/server/middleware/snapshots.js)