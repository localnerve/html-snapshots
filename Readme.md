# html-snapshots [![Build Status](https://secure.travis-ci.org/localnerve/html-snapshots.png?branch=master)](http://travis-ci.org/localnerve/html-snapshots)

> Takes html snapshots of your site's crawlable pages when a selector is visible.

## Getting Started
This library requires PhantomJS '>=1.7.1'

You can reference PhantomJS globally or supply a path to a specific version.
See [PhantomJS](http://phantomjs.org/) for more information.

## Overview
html-snapshots is a flexible, extensible html snapshotting library and command line interface that uses PhantomJS to take html snapshots of your webpages as served from your website.
By default, it iterates the pages listed in your robots.txt file and produces an html snapshot for each allowed url. The html snapshot is only taken when a specified selector is detected visible in the output.

### Input Generators
Input generators supply html-snapshots with the host-relative pages it needs to crawl to generate the snapshots for your site. The html-snapshot node module allows an input generator to be selected, but defaults to robots if none is supplied. Here are all the input generators currently supported:
+ "robots", used for supplying input from a robots.txt file
+ "textfile", used for supplying input from a simple, line-oriented text file
+ "json", used for supplying input from a json object

Right now, just the these input generators are supported. However, the robots input generator should be useful, since robots.txt is the practical source of truth for listing your site's crawlable webpages. Let me know if you can think of better or more useful use case for supplying pages to html-snapshots.

### Parallel Processing
html-snapshots processes all the pages in parallel and waits (by default) for all pages to finish processing before returning. Each page is run in a separate phantomJS process, which can be expensive and will not scale for very large websites. html-snapshots can be configured to not wait at all, but (currently) cannot be configured to not parallel process.

### Running the Command Line Interface
```shell
html-snapshots <input path to robots.txt> <hostname> <snapshot output directory> <selector>
                       2                      3                 4                    5
```
#### Additional cli positional options (beyond selector):
    6: clean snapshot directory, can be true or false (default is 'false'). This controls whether html-snapshots initially cleans the output directory before running.
    7: protocol, can be 'http' or 'https' (default is 'http'). 
    8: timeout, the per page timeout in milliseconds (default is 5000 ms). Only using the node module directly allows you to specify this timeout on a per page basis. For the cli, make this timeout large enough for the slowest loading page when supplying a global value.
    9: waitForAll, the limit for polling for completion (default is 100000 polls). Setting this to 0 will skip waiting altogether. To keep the parent process from exiting, set this count large enough to cover the loading of all the pages (in parallel) from the host.
    10: phantomjs, the path to the phantomjs executable (default is global reference to 'phantomjs').

For more options, including the ability to use input from other than a robots.txt file, use the node module directly.

### The html-snapshots Node Module
The html-snapshots node module has more options available, and is useful for inclusion as a build step or for reference from other code.
#### Options


