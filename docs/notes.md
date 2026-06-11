# Background and Other Notes

## Why Does This Exist?
The whole reason I created this library was so that I could be certain I snapshotted the page when expected content arrived (not after some arbitrary time expiration). This way, I could be certain the snapshot actually contained the content I expect.

## What if I Don't Know About The Rendered Page Content?
If you aren't interested in exact snapshots, or just want to explore because you don't know about the content detail yet, try this:
  1. Use `"body"` as the `selector` option value (every page will probably have a body).
  2. Set the `checkInterval` option high to give the page some time to render before it is written out. `checkInterval` is the time the browser script waits to check for `selector`, so consider this "render time".
  3. Set the `pollInterval` option higher than `checkInterval`.
  4. Set the `timeout` option much higher to give the whole thing time to transpire. Consider `timeout` as a multiple of `pollInterval`.

## What Happens If Your Content Does Not Appear
If your content does not show up visibly in a page according to the page's selector you configured in options, you get a timeout error - not a snapshot.

> That means the element you select **cannot be hidden** by any method.

### Why Visible?
The intention of this library is to take a snapshot when dynamic content has been rendered in the browser, and not before. One way to do that is to check for evidence that the element you selected has been rendered, and that's what the default scripts in this library do.

## Caveats

### Each Snapshot is Created in a Separate Process
html-snapshots creates a new process for each page to snapshot, and they run in parallel.
To control the parallel processing load, you can specify the `processLimit` option to limit the size of the process pool. In other words, you can limit the number of pages being processed in parallel at any one time. The default pool size is set to 4 browser processes at a time.

### The Default Snapshot Scripts
The default snapshot scripts are:
  - ["puppeteer"](https://github.com/localnerve/html-snapshots/blob/master/lib/puppeteer/index.js)
  - ["playwright"](https://github.com/localnerve/html-snapshots/blob/master/lib/playwright/index.js)

Each come with a "removeScripts" companion that you can reference by **name** alone. They also allow a custom filter to be supplied. Details [here](../README.md#snapshot-control-options).

### Override the Default Snapshot Scripts
To override the default snapshot scripts, supply a path to your own script using the `snapshotScript` option.
