# Example

> Demonstrate how to debug a page being snapshotted

> All examples assume you already have NodeJS installed on your local machine

## How To Run
1. Clone this repo
2. Open a command prompt
3. Change to the examples/custom directory
4. Run `npm install`
5. Run `node ./snapshot.js`

## What It Does
This example snapshots the entire website of the WPSPA example application using its sitemap to drive.
Sets up PhantomJS to debug just the "hello-world" route of the application on port 9000.

## How to debug on port 9000
1. Add the `phantomjsOptions` option to your html-snapshots options.
2. Assign `"--remote-debugger-port=9000"` to the page you want to debug.
3. Open up Chrome and navigate to http://`<ipaddress>`:9000. If you executed html-snapshots on the same machine, the `<ipaddress>` will be 127.0.0.1
4. For more detailed information, checkout the remote debugging section of the [PhantomJS troubleshooting](http://phantomjs.org/troubleshooting.html) guide.
