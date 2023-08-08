# History
An overview of the [Breaking Changes](#breaking-changes) and [Node Support](#node-support-tags).

## Breaking Changes

### Introduced in v2.0.0
#### Dropped support for Node 14.

### Introduced in v1.0.0
Puppeteer process introduced and used as the default browser, `browser` option added to switch back ("puppeteer" vs "phantomjs").

### Introduced in v0.19.x
#### Robots Input
Robots.txt files are now searched for `Sitemap` directive(s) **first** for sitemap/sitemapIndex files. If those directives are found, those directives are used to drive the crawl of the site alone. If no Sitemap directives are found, htmlSnapshots reverts back to using `Allow` directives. If no `Sitemap` directive is found, this is a non-breaking change.

### Introduced in v0.18.x
#### Dropped support for Node 10 & 12.

### Introduced in v0.17.x
#### Dropped support for Node 8.

### Introduced in v0.16.x
#### Dropped support for Node 6.

### Introduced in v0.15.x
#### Dropped support for Node 4.

### Introduced in v0.14.x
#### Run method return value
The library `run` method no longer returns a boolean value indicating a successful start. Instead, it returns a Promise that resolves to an array of file paths to completed snapshots, or error on failure. The `run` method's second argument, a completion callback, is now **optional** and provided for compatibility only. If you supply one, it will be called, but the Promise will also resolve, so it is not needed.
#### Dropped support for Node <= 0.12

### Introduced in v0.6.x
jQuery selectors are no longer supported by default. To restore the previous behavior, set the `useJQuery` option to `true`.
The upside is jQuery is no longer required to be loaded by the page being snapshotted. However, if you use jQuery selectors, or selectors not supported by [querySelector](https://developer.mozilla.org/en-US/docs/Web/API/document.querySelector), the page being snapshotted must load jQuery.

## Node Support Tags
| Tag | Supported Node Version |
| --- | --- |
| `v0.13.2 ` | Node 0.12 (or less) |
| `v0.14.16` | Node 4+ |
| `v0.15.x ` | Node 6+ |
| `v0.16.x ` | Node 8+ |
| `v0.17.x ` | Node 10+ |
| `v0.18.x ` | Node 14+ |
| `v0.19.x ` | Node 14+ |
| `v1.x  `   | Node 14+ |
| `v2.x  `   | Node 16+ |
