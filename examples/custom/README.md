# Example

> Snapshot a sample website using a sitemap and custom-filter

> All examples assume you already have NodeJS installed on your local machine

## How To Run
1. Clone this repo
2. Open a command prompt
3. Change to the examples/custom directory
4. Run `npm install`
5. Run `node ./snapshot.js`

## What It Does
This example snapshots the entire website of the WPSPA example application using its sitemap to drive.

It makes use of a [custom filter](https://github.com/localnerve/html-snapshots/blob/master/examples/custom/myFilter.js) to strip various tags \(and even replace some text\) from the output before the snapshots are stored.

## Notes on Interpreting Results
This example creates a local `tmp` directory where the snapshot output is stored.
Inspect the output directory structure and contents.
Compare snapshots with the original website to see what happened.