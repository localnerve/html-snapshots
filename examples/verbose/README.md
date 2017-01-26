# Example

> Snapshot a sample website with sitemap, using the verbose option to debug.

> All examples assume you already have NodeJS installed on your local machine

## How To Run
1. Clone this repo
2. Open a command prompt
3. Change to the examples/custom directory
4. Run `npm install`
5. Run `npm start`

## What It Does
This example snapshots the entire website of the WPSPA example application using its sitemap to drive. For one of the pages, produce verbose output to debug what is going on.

## Notes on Interpreting Results
This example creates a local `tmp` directory where the snapshot output is stored.
Inspect the output directory structure and contents.
Compare snapshots with the original website to see what happened.
### Verbose output
This example uses the `verbose` option to produce extended output to debug snapshotting. To see this output, you must look at the console output for the page `sample-page`.
