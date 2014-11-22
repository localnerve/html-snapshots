# Background and Other Notes

## Why does this exist?
The whole reason I created this library was so that I could be certain I snapshotted the page when expected content arrived (not after some arbitrary time expiration). This way, I could be certain the snapshot actually contained the content I expect.

## What Happens If Your Content Does Not Appear
If your content does not show up visibly in a page according to the page's selector you configured in options, you get a timeout error - not a snapshot.

> That means the element you select **cannot be hidden** by any method.

### Why Visible?
The intention of this library is to take a snapshot when dynamic content has been rendered in the browser, and not before. One way to do that is to check for evidence that the element you selected has been rendered, and that's what the default scripts in this library do.

## Caveats

### Each Snapshot is Created in a Separate Process
html-snapshots creates a new process for each page to snapshot, and they run in parallel.
To control the parallel processing load, you can specify the `processLimit` option to limit the size of the process pool. In other words, you can limit the number of pages being processed in parallel at any one time. The default pool size is set to 4 PhantomJS processes at a time.

### The Default Snapshot Scripts
The default snapshot scripts are:
  - ["default"](https://github.com/localnerve/html-snapshots/blob/master/lib/phantom/default.js)
  - ["removeScripts"](https://github.com/localnerve/html-snapshots/blob/master/lib/phantom/removeScripts.js)
  - ["customFilter"](https://github.com/localnerve/html-snapshots/blob/master/lib/phantom/customFilter.js)

As of v0.6.x, these do not rely on jQuery unless you specify a true `useJQuery` option. If you set `useJQuery` to true \(globally or per-page\), the page being snapshotted **must load jQuery itself**.

#### When Using jQuery
When using jQuery, the default snapshot scripts use jQuery is(:visible) on your supplied selector to determine document readiness \(and then triggers the snapshot\). Last I checked, this is only available in Zepto by building in a special [selector module](https://github.com/madrobby/zepto/issues/323).

#### When Not Using jQuery
When not using jQuery \(the new default behavior, from v0.6.x\), [document.querySelector](https://developer.mozilla.org/en-US/docs/Web/API/document.querySelector) is used to select the element using your supplied selector. The element selected must be an HTMLElement, and is considered visible \(triggering a snapshot\) if both offsetWidth and offsetHeight exist.

### Override the Default Snapshot Scripts
To override the default snapshot scripts, supply a path to your own phantomjs script using the `snapshotScript` option.