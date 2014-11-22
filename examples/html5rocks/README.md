# Example

> Snapshot a sample website using arrays against select html5rocks pages

> All examples assume you already have NodeJS installed on your local machine

## How To Run
1. Clone this repo
2. Open a command prompt
3. Change to the examples/html5rocks directory
4. Run `npm install`
5. Run `node ./snapshot.js`

## What It Does
This example snapshots the root page from two domains of html5rocks.com. The techniques shown could be used on any arbirary urls, not just root pages of different domains.

It uses a single input data structure to organize the work html-snapshots should do. That data is reused for the source, per-page selectors, and per-page outputPath options to keep it DRY.

## Notes on Interpreting Results
This example creates a local `tmp` directory where the snapshot output is stored.
Inspect the output directory structure and contents, compare to the input data structure.
Compare snapshots with the original website to see what happened.