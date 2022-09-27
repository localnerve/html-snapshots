#!/usr/bin/env -S node --unhandled-rejections=strict
/**
 * puppeteer process entry point
 * 
 * Command line arguments:
 * 0   - /path/to/node
 * 1   - *this script*
 * 2   - outputFile
 * 3   - url
 * 4   - selector
 * [5] - timeout
 * [6] - filter
 * [7] - debug
 * [8] - slowMo
 */
const puppeteer = require('puppeteer');
const path = require('path');
const { promises: fs } = require('fs');

if (process.argv.length < 5) {
  throw Error(`puppeteer script '${
    process.argv[1]
  }' expected these arguments:\n\
  OUTPUTFILE URL SELECTOR [TIMEOUT FILTER DEBUG SLOWMO]`);
}

const options = {
  outputFile: process.argv[2],
  url: process.argv[3],
  selector: process.argv[4],
  timeout: process.argv[5] ? parseInt(process.argv[5], 10) : 10000,
  filter: process.argv[6] && process.argv[6] !== 'false' ? process.argv[6] : null,
  debug: process.argv[7] && process.argv[7].toLowerCase() === 'true' ? true : false,
  slowMo: process.argv[8] ? parseInt(process.argv[8], 10) : 500
};
const launchOptions = options.debug ? {
  headless: false,
  slowMo: options.slowMo,
  devtools: true
} : {};

/**
 * Run the snapshot script.
 * 
 * @returns {Promise} on completion
 */
async function run () {
  let timeLeft, browser;
  const start = Date.now();

  timeLeft = options.timeout - 200; // leave some room for reporting
  if (timeLeft < 0) timeLeft = 0;

  try {
    const filter =
      options.filter ? require(options.filter) : passthru => passthru;

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.goto(options.url, {
      timeout: timeLeft
    });

    timeLeft -= (Date.now() - start);
    if (timeLeft < 0) timeLeft = 0;

    await fs.mkdir(path.dirname(options.outputFile), {
      recursive: true
    });

    await page.waitForSelector(options.selector, {
      Visible: true,
      timeout: timeLeft
    });

    const content = await page.content();
    await fs.writeFile(options.outputFile, filter(content));
    const elapsed = Date.now() - start;

    await browser.close();
    
    return `snapshot for ${options.url} finished in ${elapsed} ms\n\
  written to ${options.outputFile}`;
    } catch (e) {
      const err = new Error(`failed to snapshot ${options.url}`, {
        cause: e
      });
      if (browser) {
        browser.close().finally(() => {
          throw err;
        });
      }
      throw err;
    }
}
run().then(console.log).catch(e => {
  throw e;
});