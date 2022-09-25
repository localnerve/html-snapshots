#!/usr/bin/env node
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
  }' expected these arguments: OUTPUTFILE URL SELECTOR [TIMEOUT FILTER DEBUG SLOWMO]`);
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
function run () {
  
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    let timeLeft, error, msg, page, browser;
    const start = Date.now();

    timeLeft = options.timeout - 200; // leave some room for reporting
    if (timeLeft < 0) timeLeft = 0;

    try {
      const filter = options.filter ? require(options.filter) : passthru => passthru;

      browser = await puppeteer.launch(launchOptions);
      page = await browser.newPage();
      await page.goto(options.url, {
        timeout: timeLeft
      });

      timeLeft -= (Date.now() - start);
      if (timeLeft < 0) timeLeft = 0;

      fs.mkdir(path.dirname(options.outputFile), { recursive: true })
        .then(() => page.waitForSelector(options.selector, {
          Visible: true,
          timeout: timeLeft
        }))
        .then(() => page.content())
        .then(content => fs.writeFile(options.outputFile, filter(content)))
        .then(() => {
          const elapsed = Date.now() - start;
          msg =
            `snapshot for ${options.url} finished in ${elapsed} ms\n\twritten to ${options.outputFile}`;
        })
        .catch(err => {
          error = err;
          msg = `failed to snapshot ${options.url}\n\t${err}`;
        })
        .then(() => (browser && browser.close()) || Promise.resolve())
        .finally(() => {
          if (error) {
            reject(new Error(msg));
          } else {
            resolve(msg);
          }
        });
    } catch (e) {
      if (browser) {
        return browser.close()
          .finally(() => {
            reject(e);
          });
      }
      return reject(e);
    }
  })
}
run().then(console.log).catch(console.error);