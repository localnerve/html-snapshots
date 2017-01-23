# Example

> Snapshot a sample website using an robots.txt.
> Limit the number of browser processes to one, forcing serial processing.

> All examples assume you already have NodeJS installed on your local machine

## How To Run
1. Clone this repo
2. Open a command prompt
3. Change to the examples/simple-promise directory
4. Run `npm install`
5. Run `npm start`

## What It Does
This example snapshots an example website. Sets the `processLimit` option to 1,
forcing serial page processing and limiting the number of browser processes
running at once to one. There will just be one node process and one browser process
used during the run.

## Notes on Interpreting Results
This example creates a local `tmp` directory where the snapshot output is stored.
Inspect the output directory structure and contents.
Compare snapshots with the original website to see what happened.
