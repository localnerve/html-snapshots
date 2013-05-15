# [html-snapshots v0.1.0](http://github.com/localnerve/html-snapshots) [![Build Status](https://secure.travis-ci.org/localnerve/html-snapshots.png?branch=master)](http://travis-ci.org/localnerve/html-snapshots)

> Takes html snapshots of your site's crawlable pages when a selector becomes visible.

## Overview
html-snapshots is a flexible html snapshot library that uses PhantomJS to take html snapshots of your webpages served from your site. A snapshot is only taken when a specified selector is detected visible in the output html. This tool is useful when your site is largely ajax content, or an SPA, and you want your dynamic content indexed by search engines.

Your site's pages are read from either a robots.txt or sitemap.xml. Alternatively, you can supply an array with completely arbitrary urls to snapshot, or a line delimited textfile for arbitrary host-relative paths.

html-snapshots processes all the pages in parallel in their own PhantomJS processes.

## Getting Started
This library requires PhantomJS '>=1.7.1'

### Installation
The simplest way to install html-snapshots is to use [npm](http://npmjs.org), just `npm
install html-snapshots` will download html-snapshots and all dependencies.

### Grunt Task
If you are interested in the grunt task that uses this library, check out [grunt-html-snapshots](http://github.com/localnerve/grunt-html-snapshots).

## Example Usage

### Simple example
```javascript
var htmlSnapshots = require('html-snapshots');
htmlSnapshots.run({
  source: "path/to/robots.txt",
  hostname: "exampledomain.com",
  outputDir: "./snapshots",
  outputDirClean: true,
  selector: "#dynamic-content"
});
```
This reads the urls from your robots.txt and produces snapshots in the ./snapshots directory. In this example, a selector named "#dynamic-content" appears in all pages across the site.

### Example - Per page selectors and timeouts
```javascript
var htmlSnapshots = require('html-snapshots');
htmlSnapshots.run({
  input: "sitemap",
  source: "path/to/sitemap.xml",
  outputDir: "./snapshots",
  outputDirClean: true,
  selector: { "http://mysite.com": "#home-content", "__default": "#dynamic-content" },
  timeout: { "http://mysite.com/superslowpage", 6000 }
});
```
This reads the urls from your sitemap.xml and produces snapshots in the ./snapshots directory. In this example, a selector named "#dynamic-content" appears in all pages across the site except the home page, where "#home-content" appears. Also, html-snapshots uses the default timeout (5000 ms) on all pages except http://mysite.com/superslowpage, where it waits 6000 ms.

### Example - Per page special output paths
```javascript
var htmlSnapshots = require('html-snapshots');
htmlSnapshots.run({
  input: "sitemap",
  source: "path/to/sitemap.xml",
  outputDir: "./snapshots",
  outputDirClean: true,
  outputPath: { "http://mysite.com/services/?page=1": "services/page/1", "http://mysite.com/services/?page=2": "services/page/2" },
  selector: "#dynamic-content"
});
```
Here, we have a couple of pages with query strings and don't want html-snapshots to create directories with query string characters in the names. We would also have to have a rewrite rule that reflects this same mapping when '_escaped_fragment_' shows up in the querystring of a request so we serve the snapshot.

## Options
Apart from the default settings, there are a number of options that can be specified. Options are specified in an object to the module's run method ``htmlSnapshots.run({ optionName: value })``. Possible options are:
+ `input` 
++ default: `"robots"`
++ Specifies the input generator to be used to produce the urls. Possible values:
+++ "sitemap", supply pages from a local or remote sitemap.xml file.
+++ "robots", (default) supply pages from a local or remote robots.txt file. Robots.txt files with wildcards are NOT supported - Use "sitemap" instead.
+++ "textfile", supply pages from a local line-oriented text file in the style of robots.txt
+++ "array", supply arbitrary pages from a javascript array.
+ `source`
++ default: `"./robots.txt"`, `"./sitemap.xml"`, `"./line.txt"`, or [], depending on the input generator.
++ Specifies the input source. This must be a file or url for the robots, sitemap, and textfile input generators. For the array input generator, this must be a javascript array of urls.
+ `hostname`
++ default: `"localhost"`
++ Specifies the hostname to use for paths found in a robots.txt or textfile. This option is ignored if you are using the sitemap or array input generators.
+ `port`
++ default: 80
++ Specifies the port to use for paths found in a robots.txt or textfile. This option is ignored if you are using the sitemap or array input generators.
+ `auth`
++ default: none
++ Specifies the old-school authentication portion of the url. Best to not do this.
+ `protocol`
++ default: `"http"`
++ Specifies the protocol to use for paths found in a robots.txt or textfile. This option is ignored if you are using the sitemap or array input generators.
+ `outputDir`
++ default: `"./snapshots"`
++ Specifies the root output directory to put the snapshot files in.
+ `outputDirClean`
++ default: `false`
++ Specifies if html-snapshots should clean the output directory before it creates the snapshots.
+ `outputPath`
++ default: none
++ Specifies per url (or path) overrides to the generated output directory. The default output path for a snapshot file is rooted at outputDir, but is simply an echo of the input path. Depending on your urls, your _escaped_fragment_ rewrite rule, or the characters allowed in directory names on your server, it might be desireable to change this. If supplied this must be a key/value pair object where the key must match the url (or path) found by the input generator. For simple, pretty urls, it should not be required to use this. The output file name is always "index.html".
+ `selector`
++ default: `"body"`
++ Specifies the selector to find in the output before taking the snapshot. The value can be one of these javascript types:
+++ `"string"` If the value is a string, it is used for every page in the website. 
+++ `"object"` If the value is an object, it is interpreted as key/value pairs where the key must match the url (or path) found by the input generator. This allows you to specify selectors for individual pages. The reserved key "__default" allows you to specify the default selector so you don't have to specify a selector every individual page.
+++ `"function"` If the value is a function, it is called for every page found by the input generator and passed a single argument that is the url (or path) found.
+ `timeout`
++ default: 5000 (milliseconds)
++ Specifies the time to wait for the selector to become visible. The value can be of these one of these javascript types:
+++ `"number"` If the value is a number, it is used for every page in the website.
+++ `"object"` If the value is an object, it is interpreted as key/value pairs where the key must match the url (or path) found by the input generator. This allows you to specify timeouts for individual pages. The reserved key "__default" allows you to specify the default timeout so you don't have to specify a timeout for every individual page.
+++ `"function"` If the value is a function, it is called for every page found by the input generator and passed a single argument that is the url (or path) found.
+ `checkInterval`
++ default: 250 (milliseconds)
++ Specifies the rate at which the PhantomJS script checks to see if the selector is visible yet. Not configurable per page.
+ `snapshotScript`
++ default: this library's phantom/snapshotSingle.js file
++ Specifies the PhantomJS script to run to actually produce the snapshot. Override this if you need to supply your own snapshot script. This script is run per url (or path) by html-snapshots in a separate PhantomJS process.
+ `phantomjs`
++ default: "phantomjs", a reference to phantomjs installed globally.
++ Specifies the phantomjs executable to run. Override this if you need to supply a path to a local version of phantomjs. So you can reference PhantomJS globally (by default), or supply a path to a specific version.
See [PhantomJS](http://phantomjs.org/) for more information.

## Example Rewrite Rule
Here is an example apache rewrite rule for rewriting _escaped_fragment_ requests to the snapshots directory on your server.
```
<ifModule mod_rewrite.c>
  RewriteCond %{QUERY_STRING} ^_escaped_fragment_=(.*)$
  RewriteCond %{REQUEST_URI} !^/snapshots [NC]
  RewriteRule ^(.*)/?$ /snapshots/$1 [L]
</ifModule>
```
This serves the snapshot to any request for a url (perhaps found by a bot in your robots.txt or sitemap.xml) to the snapshot output directory. In this example, no translation is done, it simply takes the request as is and serves its corresponding snapshot. So a request for `http://mysite.com/?_escaped_fragment_=` serves the mysite.com homepage snapshot.
