# Background and Other Notes

## Why does this exist?
The whole reason I created this library was so that I could be certain I snapshotted the page when expected content arrived (not after some arbitrary time expiration). This way, I could be certain the snapshot actually contained the content I expect. 

## What Happens If Your Content Does Not Appear
If your content does not show up in a page, you get a timeout error - not a snapshot. Since I use this in builds, this is great (for me). It fails fast, and sometimes shows me that I've missed something.

## Caveats

### Each Snapshot is Created in a Separate Process
html-snapshots creates a new process for each page to snapshot, and they run in parallel. I only use this library in a build process on a linux box, so I'm not concerned with creating a lot of processes. However, if you had a site with 1000's of pages, this could become an issue if you are building on a "process-heavy" OS. Futhermore, if you were using html-snapshots live on the server, this could be a deal breaker for a big site.

### The Default Snapshot Script
The default snapshot script, [snapshotSingle.js](https://github.com/localnerve/html-snapshots/blob/master/lib/phantom/snapshotSingle.js), relies on jQuery to be loaded in every page you snapshot. In other words, _your_ page has to load jQuery. The default snapshot script does not temporarily inject jQuery for you in your pages. Suggestions for fancier snapshot scripts are welcome...

The default snapshot script uses jQuery is(:visible) to make the actual determination if the selector is in the output. Last I checked, this is only available in Zepto by building in a special [selector module](https://github.com/madrobby/zepto/issues/323).