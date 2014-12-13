# Example

> Demonstrate how to debug a page being snapshotted in PhantomJS

> All examples assume you already have NodeJS installed on your local machine

## How To Run
1. Clone this repo
2. Open a command prompt
3. Change to the examples/debug-phantomjs directory
4. Run `npm install`
5. Run `node ./snapshot.js`

## What It Does
This example snapshots the entire website of the WPSPA example application using its sitemap to drive.
However, it sets up PhantomJS to debug just the "hello-world" page of the application on port 9000 as seen through the default html-snapshots script.
The html-snapshots process will see the page you are debugging timeout, but that is OK - we're holding it for debugging.

NOTE: Each PhantomJS instance launched with the --remote-debugger-port option will stay alive, even after the script calls exit. You have to end the process yourself.

## How to debug on port 9000
1. Add the `phantomjsOptions` option to your html-snapshots options.
2. Assign `"--remote-debugger-port=9000"` to the page you want to debug.
3. Open up Chrome and navigate to http://`<ipaddress>`:9000. If you executed html-snapshots on the same machine, the `<ipaddress>` will be 127.0.0.1
4. Click "about:blank"
5. In the "Scripts" tab, find the "about:blank" script in the dropdown. This is the html-snapshots default PhantomJS script.
6. Set some breakpoints.
7. In the "Console" tab, type `__run()` and hit enter.
8. Step through the code.

For more detailed explanation, checkout the remote debugging section of the [PhantomJS troubleshooting](http://phantomjs.org/troubleshooting.html) guide.

Even after the script exits, PhantomJS will stick around because it was launched in debug mode. Presumably, this is so you can continue debugging over and over if need be.

If you want to kill it:

1. `pgrep phantomjs` to find the PID of the phantomjs debug process
2. kill -15 <PID>
