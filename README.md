# [html-snapshots](http://github.com/localnerve/html-snapshots)

[![npm version](https://badge.fury.io/js/html-snapshots.svg)](http://badge.fury.io/js/html-snapshots)
![Verify](https://github.com/localnerve/html-snapshots/workflows/Verify/badge.svg)
[![Coverage Status](https://img.shields.io/coveralls/localnerve/html-snapshots.svg)](https://coveralls.io/r/localnerve/html-snapshots?branch=master)

> Takes html snapshots of your site's crawlable pages when an element you select is rendered.

## Contents
+ [Overview](#overview)
+ [Getting Started](#getting-started)
+ [Grunt Task](https://github.com/localnerve/grunt-html-snapshots)
+ [More Information](#more-information)
+ [API Reference](#api)
+ [Example Usage](#example-usage)
+ [Option Reference](#options)
  + [Input Options](#input-control-options)
  + [Output Options](#output-control-options)
  + [Snapshot Options](#snapshot-control-options)
  + [Process Options](#process-control-options)
+ [Rewrite and Middleware Examples](#example-rewrite-rule)
+ [Worker Process and Middleware Article and Examples](/docs/example-heroku-redis.md)
+ [License](#license)

## Overview
html-snapshots is a flexible html snapshot library that uses a headless browser to take html snapshots of your webpages served from your site. A snapshot is only taken when a specified selector is detected visible in the output html. This tool is useful when your site is largely ajax content, or an SPA, and you want your dynamic content indexed by search engines.

html-snapshots gets urls to process from either a robots.txt, sitemap.xml, or sitemap-index.xml. Alternatively, you can supply an array with completely arbitrary urls, or a line delimited textfile with arbitrary host-relative paths.

## Getting Started

### Installation
The simplest way to install html-snapshots is to use [npm](http://npmjs.org), just `npm
install html-snapshots` will download html-snapshots and all dependencies.

### Gulp Task
This is a node library that just works with gulp as-is.

### Grunt Task
If you are interested in the grunt task that uses this library, check out [grunt-html-snapshots](http://github.com/localnerve/grunt-html-snapshots).

## More Information
Here are some [background and other notes](/docs/notes.md) regarding this project.
  + [Why Does This Library Exist?](/docs/notes.md#why-does-this-exist)
  + [How To Use Without Knowing About Page Content](/docs/notes.md#what-if-i-dont-know-about-the-rendered-page-content)
  + [Caveats](/docs/notes.md#caveats)
  + [Support History](HISTORY.md)

### Process Model
html-snapshots takes snapshots in parallel, each page getting its own browser process. Each browser process dies after snapshotting one page. You can limit the number of browser processes that can ever run at once with the `processLimit` option. This effectively sets up a process pool for browser instances. The default processLimit is 4 browser instances. When a browser process dies, and another snapshot needs to be taken, a new browser process is spawned to take the vacant slot. This continues until a `processLimit` number of processes are running at once.

## API
The api is just one `run` method that returns a Promise.

### *Promise* run (options[, callback])
A method that takes [options](#options) and an optional callback. Returns a Promise.  
**Syntax:**
```javascript
const htmlSnapshots = require('html-snapshots');

htmlSnapshots.run(options[, callback])
.then(completed => {
  // `completed` is an array of paths to the completed snapshots.
})
.catch(errorObject => {
  // `errorObject` is an instance of Error
  // `errorObject.completed` is an array of paths to the snapshots that did successfully complete.
  // `errorObject.notCompleted` is an array of paths to files that DID NOT successfully complete.
});
```
#### Callback
The callback is optional because the run method returns a Promise that resolves on completion. If you supply a callback, it will be called, but the Promise will ALSO resolve. Callback usage is deprecated, and is made available for compatibility with older versions.

Signature of the optional callback:
```javascript
callback (errorObject, arrayOfPathsToCompletedSnapshots)
```
*For the callback, in the error case, the errorObject does not have the new extra properties `completed` and `notCompleted`. However, `arrayOfPathsToCompletedSnapshots` is supplied, and contains the paths to the snapshots that successfully completed.*

## Example Usage
This example reads the pages from a mix of sitemap or sitemap-index files found in the robots.txt and produces snapshots in the ./snapshots directory. In this example, a selector named "#dynamic-content" appears in all pages across the site. Once this selector is visible in a page, the html snapshot is taken and saved to ./snapshots.

### Quick Example
```javascript
const htmlSnapshots = require('html-snapshots');
htmlSnapshots.run({
  source: 'https://host.domain/robots.txt',
  selector: '#dynamic-content',
  outputDir: './snapshots',
  outputDirClean: true
})
.then(completed => {
  // completed is an array of full file paths to the completed snapshots.
})
.catch(error => {
  // error is an Error instance.
  // error.completed is an array of snapshot file paths that did complete.
  // error.notCompleted is an array of file paths that did NOT complete.
});
```

More examples can be found in [this document](/examples/README.md). Also, A showcase of runnable examples can be found [here](/examples).

An older (version 0.13.2), more in depth usage example is located in this [article](/docs/example-heroku-redis.md) that includes explanation and code of a real usage featuring dynamic app routes, ExpressJS, Heroku, and more.

## Options
> Every option has a default value except `outputDir`.

### Input Control Options

  * **input** {String}
    + default: `"robots"`
    + Specifies the input generator to be used to produce the urls.

        Possible *values*:

        + `"sitemap"` Supply urls from a local or remote sitemap.xml file. Gzipped sitemaps are supported.
        + `"sitemap-index"` Supply urls from a local or remote sitemap-index.xml file. Gzipped sitemap indexes are supported.
        + `"array"`, supply arbitrary urls from a javascript array.
        + `"robots"` Supply urls from a local or remote robots.txt file. Robots.txt is first scanned for `Sitemap` directives. If found, those are used to drive the crawl. Otherwise, `Allow` directives are used in conjunction with [origin options](#origin-options).
        + `"textfile"` Supply urls from a local line-oriented text file in the style of robots.txt

  * **source** {String}
    + default: `"./robots.txt"`, `"./sitemap.xml"`, `"./sitemap-index.xml"`, `"./line.txt"`, or `[]`, depending on the input generator.
    + Specifies the input source. This must be a valid array or the location of a robots, text, or sitemap file for the corresponding input generator. robots.txt, sitemap.xml(.gz), sitemap-index.xml(.gz) can be local or remote. However, for the array input generator, this must be an array of urls.

##### Sitemap Only Input Options
> Options that apply to robots.txt with Sitemap directives, sitemaps, and sitemap-index input

  * **sitemapPolicy** {Boolean}
    + default: `false`
    + For use only with the robots, sitemap, and sitemap-index input generators. When true, lastmod and/or changefreq sitemap url child elements can be used to determine if a snapshot needs to be taken. Here are the possibilities for usage:  
      + Both lastmod and changefreq tags are specified alongside loc tags in the sitemap. In this case, both of these tags are used to determine if the url is out-of-date and needs a snapshot.
      + Only a lastmod tag is specified alongside loc tags in the sitemap. In this case, if an output file from a previous run is found for the url loc, then the file modification time is compared against the lastmod value to see if the url is out-of-date and needs a snapshot.
      + Only a changefreq tag is specified alongside loc tags in the sitemap. In this case, if an output file from a previous run is found for the url loc, then the last file modification time is used as a timespan \(from now\) and compared against the given changefreq to see if the url is out-of-date and needs a snapshot.

    Note that for `sitemap-index`, only [lastmod](https://www.sitemaps.org/protocol.html#sitemapIndexTagDefinitions) policy element is available as a policy control.

    Not all url elements in a sitemap have to have lastmod and/or changefreq \(those tags are optional, unlike loc\), but the urls you want to be able to skip \(if they are current\) must make use of those tags. You can intermix usage of these tags, as long as the requirements are met for making an age determination. If a determination on age cannot be made for any reason, the url is processed normally. For more info on sitemap tags and acceptable values, read the [wikipedia](http://en.wikipedia.org/wiki/Sitemaps) page.

  * **sitemapOutputDir** {String}
    + default: `_sitemaps_`
    + For use only with the sitemap-index input generator, this option directs the storage of sitemaps locally. It is a string that defines the name of the subdirectory under the `outputDir` where sitemaps are stored.
    Locally stored sitemaps are used for age determinations with incoming lastmod tags. If this option is falsy, it will prevent sitemap storage and thereby disable sitemapPolicy for sitemaps referenced in a sitemap-index.

    The [examples](/examples) directory contains [sitemap-index](/examples/sitemap-index) and [sitemap](/examples/custom) usage examples.

##### Origin Options
> Origin options are only useful for Robots.txt files that use `Allow` directives and Textfile input types.

  * **hostname** {String}
    + default: `"localhost"`
    + Specifies the hostname to use for paths found in a robots.txt or textfile. Applies to all pages. This option is ignored if you are using the sitemap or array input generators.

  * **port** {Number}
    + default: 80
    + Specifies the port to use for all paths found in a robots.txt or textfile. This option is ignored if you are using the sitemap or array input generators.

  * **auth** {String}
    + default: none
    + Specifies the old-school authentication portion of the url. Applies to all path found in a robots.txt or textfile.

  * **protocol** {String}
    + default: `"http"`
    + Specifies the protocol to use for all paths found in a robots.txt or textfile. This option is ignored if you are using the sitemap or array input generators.

### Output Control Options

  * **outputDir** {String}
    + default: none
    + **Required** \(you must specify a value\). Specifies the root output directory to put all the snapshot files in. Paths to the snapshot files in the output directory are defined by the paths in the urls themselves. The snapshot files are always named "index.html".

  * **outputDirClean** {Boolean}
    + default: `false`
    + Specifies if html-snapshots should clean the output directory before it creates the snapshots. If you are using sitemapPolicy and only specifying one of lastmod or changefreq in your sitemap \(thereby relying on file modification times on output files from a previous run\) this value must be false.

  * **outputPath** {Object|Function}
    + default: none
    + Specifies per url overrides to the generated snapshot output path. The default output path for a snapshot file, while rooted at outputDir, is simply an echo of the input path - plus any arguments. Depending on your urls, your `_escaped_fragment_` rewrite rule (see below), or the characters allowed in directory names in your environment, it might be necessary to use this option to change the output paths.

        The value can be one of these *javascript types*:

        `"object"` If the value is an object, it must be a key/value pair object where the key must match the url (or path in the case of robots.txt style) found by the input generator.

        `"function"` If the value is a function, it is called for every page and passed a single argument that is the url (or path in the case of robots.txt style) found in the input. The value returned for a given page must be a string that can be used on the filesystem for a path.

  **Notes:**   
  + If you already have pretty urls, this option may not be wanted/needed.
  + The output file name is always "index.html".

### Snapshot Control Options

  * **selector** {String|Object|Function}
    + default: `"body"`
    + The selector to wait for in the output that triggers a snapshot to be taken.

        The value can be one of these *javascript types*:

        `"string"` If the value is a string, it is used for every page.       

        `"object"` If the value is an object, it is interpreted as key/value pairs where the key must match the url (or path in the case of robots.txt style) found by the input generator. This allows you to specify selectors for individual pages. The reserved key "__default" allows you to specify the default selector so you don't have to specify a selector for every individual page.

        `"function"` If the value is a function, it is called for every page and passed a single argument that is the url (or path in the case of robots.txt style) found in the input. The function must return a value to use for this option for the page it is given. The value returned for a given page must be a string.

    NOTE: By default, selectors must conform to [this spec](http://www.w3.org/TR/selectors-api/#grammar), as they are used by [querySelector](https://developer.mozilla.org/en-US/docs/Web/API/document.querySelector). If you need selectors not supported by this, you must specify the `useJQuery` option, and load jQuery in your page.

  * **snapshotScript** {String|Object}
    + default: This library's default snapshot script. Which one is used is determined by the [`browser`](#process-control-options) option.
    + Specifies the browser script to run to actually produce the snapshot. The script supplied in this option is run per url (or path) by html-snapshots in a separate browser process. Applies to all pages.

        The value can be one of these *javascript types*:

        `"string"` If the value is a string, it must an absolute path to a custom script you supply.  
         
        + `browser: "phantomjs"`:  
        html-snapshots will spawn a separate phantomjs process to run your snapshot script and give it the following [arguments](http://phantomjs.org/api/system/property/args.html):  
          + `system.args[0]` The path to your PhantomJS script.
          + `system.args[1]` The output file path.
          + `system.args[2]` The url to snapshot.
          + `system.args[3]` The selector to watch for to signal page completion.
          + `system.args[4]` The overall timeout \(milliseconds\).
          + `system.args[5]` The interval \(milliseconds\) to watch for the selector.
          + `system.args[6]` A flag indicating jQuery selectors should be supported.
          + `system.args[7]` A flag indicating verbose output is desired.
          + `system.args[8]` A custom module to load.  

        + `browser: "puppeteer"`:  
        html-snapshots will spawn your script as a separate process and give it the following arguments:  
          + `process.argv[0]` The path to NodeJS.
          + `process.argv[1]` The path to your snapshot script.
          + `process.argv[2]` The output file path.
          + `process.argv[3]` The url to snapshot.
          + `process.argv[4]` The selector to wait for to signal page completion.
          + `process.argv[5]` The overall timeout \(milliseconds\).
          + `process.argv[6]` The path to a custom NodeJS module that returns a filter function.
          + `process.argv[7]` A debug flag to kick the browser into headed, devtools mode.
          + `process.argv[8]` A slowMo time \(milliseconds\) to slow the browser down.

        `"object"` If an object is supplied, it has the following properties:  
        + `script` This must be one of the following values:  
          + `"removeScripts"` This runs the default snapshot script with an output filter that removes all script tags are removed from the html snapshot before it is saved.
          + `"customFilter"` This runs the default snapshot script, but allows you to supply any output filter.
        + `module` This property is required only if you supplied a value of `"customFilter"` for the `script` property. This must be an absolute path to a PhantomJS module you supply. Your module will be `require`d and called as a function to filter the html snapshot output. Your module's function will receive the entire raw html content as a single input string, and must return the filtered html content.

        customFilter Example:
        ```javascript
        // option snippet showing snapshotScript object with "customFilter":
        {
          snapshotScript: {
            script: 'customFilter',
            module: '/path/to/myFilter.js'
          }
        }

        // in myFilter.js:
        module.exports = function(content) {
          return content.replace(/someregex/g, 'somereplacement'); // remove or replace anything
        }
        ```
        A more complete example using custom options is available [here](/examples/custom).  

  * **debug** {Object}
    > This options is only supported with the puppeteer browser script.  
    + default: `{ flag: false, slowMo: 500 }`  
    + Setting the `debug.flag` to true starts chrome in headed mode with devtools open. `debug.slowMo` is a time in milliseconds to reduce browser processing speed (larger numbers slows down chrome more).  

  * **useJQuery** {Boolean|Object|Function}
    > This option is only supported with the phantomjs browser script.  
    + default: `false`  
    + Specifies to use jQuery selectors to detect when to snapshot a page. Please note that you cannot use these selectors if the page to be snapshotted does not load jQuery itself. To return to the behavior prior to v0.6.x, set this to `true`.  

        The value can be one of these *javascript types*:

        `"boolean"` If the value is a boolean, it is used for every page. Note that if it is any scalar type such as "string" or "number", it will be interpreted as a boolean using javascript rules. Coerced string values "true", "yes", and "1" are specifically true, all others are false.

        `"object"` If the value is an object, it is interpreted as key/value pairs where the key must match the url (or path in the case of robots.txt style) found by the input generator. This allows you to specify the use of jQuery for individual pages. The reserved key "__default" allows you to specify a default jQuery usage so you don't have to specify usage for every individual page.

        `"function"` If the value is a function, it is called for every page and passed a single argument that is the url (or path in the case of robots.txt style) found in the input. The function must return a value to use for this option for the page it is given. The value returned for a given page must be a boolean.

    NOTE: You do not *have to* use this option if your page uses jQuery. You only need this if your selector is not supported by [querySelector](https://developer.mozilla.org/en-US/docs/Web/API/document.querySelector). However, if you do use this option, the page being snapshotted must load jQuery itself.

  * **verbose** {Boolean|Object|Function}
    > This option is only used with the phantomjs browser script
    + default: `false`
    + Specifies to turn on extended console output in the PhantomJS process for debugging purposes. Can be applied to all pages, or just specific page(s). It is recommended to do this one page at a time, as the output can be large, and interleaved with parallel processes. See following explanation of types for how to debug just one page, and also [this example](/examples/verbose).

        The value can be one of these *javascript types*:

        `"boolean"` If the value is a boolean, it is used for every page. Note that if it is any scalar type such as "string" or "number", it will be interpreted as a boolean using javascript rules. Coerced string values "true", "yes", and "1" are specifically true, all others are false.

        `"object"` If the value is an object, it is interpreted as key/value pairs where the key must match the url (or path in the case of robots.txt style) found by the input generator. This allows you to specify the use of verbose output for individual pages. The reserved key "__default" allows you to specify the default `verbose` usage so you don't have to specify usage for every individual page.

        `"function"` If the value is a function, it is called for every page and passed a single argument that is the url (or path in the case of robots.txt style) found in the input. The function must return a value to use for this option for the page it is given. The value returned for a given page must be a boolean.

### Process Control Options

  * **browser** {String}
    + default: `"puppeteer"`
    + Specifies which browser process to use in the crawl. Can be one of "phantomjs" or "puppeteer".  

  * **timeout** {Number|Object|Function}
    + default: 10000 \(milliseconds\)
    + Specifies the time to wait for the selector to become visible.

        The value can be one of these *javascript types*:

        `"number"` If the value is a number, it is used for every page in the website.      

        `"object"` If the value is an object, it is interpreted as key/value pairs where the key must match the url (or path in the case of robots.txt style) found by the input generator. This allows you to specify timeouts for individual pages. The reserved key "__default" allows you to specify the default timeout so you don't have to specify a timeout for every individual page.

        `"function"` If the value is a function, it is called for every page and passed a single argument that is the url (or path in the case of robots.txt style) found in the input. The function must return a value to use for this option for the page it is given. The value returned for a given page must be a number.

  * **processLimit** {Number}
    + default: 4
    + Limits the number of child PhantomJS processes that can ever be actively running in parallel. A value of 1 effectively forces the snapshots to be taken in series (only one at a time). Useful if you need to limit the number of processes spawned by this library. Experiment with what works best. One guideline suggests about [4 per CPU](http://stackoverflow.com/questions/9961254/how-to-manage-a-pool-of-phantomjs-instances).

  * **pollInterval** {Number}
    + default: 500 \(milliseconds\)
    + Specifies the rate at which html-snapshots checks to see if a browser script has completed. Applies to all pages.

  * **checkInterval** {Number}
    > This option is only used with the phantomjs browser script
    + default: 250 (milliseconds)
    + Specifies the rate at which the PhantomJS script checks to see if the selector is visible yet. Applies to all pages.

  * **phantomjsOptions** {String|Array|Object|Function}
    > This option is only used with the phantomjs browser script
    + default: ""
    + Specifies options to give to PhantomJS. Can specify per page or for all pages. Since PhantomJS instances run per page, it is possible to specify different PhantomJS options per page. Useful for debugging PhantomJS scripts on a specific page.
    For PhantomJS options syntax, checkout the [current options](http://phantomjs.org/api/command-line.html).
    Checkout [the source](https://github.com/ariya/phantomjs/blob/master/src/config.cpp#L49) for PhantomJS options coming next.

        The value can be one of these *javascript types*:

        `"string"` If the value is a string, it is a single option string used for every page.

        `"array"` If the value is an array, it can contain multiple option strings used for every page.

        `"object"` If the value is an object, it is interpreted as key/value pairs where the key must match the url (or path in the case of robots.txt style) found by the input generator. This allows you to specify PhantomJS options for individual pages. The reserved key "__default" allows you to specify default options so you don't have to specify options for every individual page. The values can be either a string \(for a single option\), or an array \(for multiple options \).

        `"function"` If the value is a function, it is called for every page and passed a single argument that is the url (or path in the case of robots.txt style) found in the input. The function must return a value to use for this option for the page it is given. The value returned for a given page must be either a string or an array.

        Multiple Options Examples:
        ```javascript
        // option snippet showing multiple options for all pages
        {
          phantomjsOptions: ["--load-images=false", "--ignore-ssl-errors=true"]
        }

        // option snippet showing multiple options for one page only (object notation)
        {
          phantomjsOptions: {
            // key must exactly match the page as defined in the input (sitemap, array, robots, etc)
            "http://mysite.com/mypage": ["--load-images=false", "--ignore-ssl-errors=true"],
          }
        }
        ```
        An example demonstrating how to **debug** a PhantomJS script is available [here](/examples/debug-phantomjs). It also demonstrates per-page option usage.

  * **phantomjs** {String}
    > This option is only used with the phantomjs browser script
    + default: A package local reference to PhantomJS.
    + Specifies the PhantomJS executable to run. Applies to all pages. Override this if you want to supply a path to a different version of PhantomJS. To reference PhantomJS globally in your environment, just use the value, "phantomjs". Remember, it must be found in your environment path to execute.
  See [PhantomJS](http://phantomjs.org/) for more information.
  Also [PhantomJS 2](https://github.com/ariya/phantomjs/wiki/PhantomJS-2).

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

### Connect-modrewrite
You can also refer `_escaped_fragment_` requests to your snapshots in ExpressJS with a similar method using [connect-modrewrite](https://github.com/tinganho/connect-modrewrite) middleware. Here is an analogous example of a connect-modrewrite rule:
```javascript
  '^(.*)\\?_escaped_fragment_=.*$ /snapshots/$1 [NC L]'
```

### Middleware Example
An ExpressJS middleware example using html-snapshots can be found at [wpspa/server/middleware/snapshots.js](https://github.com/localnerve/wpspa/blob/master/server/middleware/snapshots.js).   
Here is the [article](/docs/example-heroku-redis.md) on how this middleware works with html-snapshots.

## License
This software is free to use under the LocalNerve, LLC MIT license. See the [LICENSE file](/LICENSE) for license text and copyright information.

Third-party open source code used are listed in the [package.json file](/package.json).
