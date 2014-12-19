# A Real html-snapshots Usage Example

> This article explains an implementation using [html-snapshots](https://github.com/localnerve/html-snapshots) in the wild \(with real, working code\). Please note the code referenced in this article was written by LocalNerve and is subject to the terms of this [license](https://github.com/localnerve/wpspa/blob/master/LICENSE.txt).

## Summary
The [WPSPA](http://github.com/localnerve/wpspa) project uses [html-snapshots](https://github.com/localnerve/html-snapshots) on [Heroku](https://www.heroku.com/) to populate a Redis store from which the snapshotted html is served on \_escaped\_fragment\_ requests. The [html-snapshots](https://github.com/localnerve/html-snapshots) library is run in a Heroku worker process that periodically keeps the snapshots up-to-date with a CMS. 

The application content and routes in [WPSPA](http://github.com/localnerve/wpspa) are dynamic, so this required me to run [html-snapshots](https://github.com/localnerve/html-snapshots) in a worker on the server to get the dynamic content updates over time.

> Langauge: Javascript

> Tools: NodeJS, ExpressJS, PhantomJS, Redis

## Serving Html Snapshots in a Scalable Cloud Environment
Since [WPSPA](http://github.com/localnerve/wpspa) runs on Heroku, it is serving the application from [Dynos](https://devcenter.heroku.com/articles/dynos). In essence, Dynos are billable CPU/Memory hours with independent, ephemeral file systems. Dynos can be created and destroyed at will to scale the application. Which one you get when you visit the site is up to the [Heroku routing mesh](https://devcenter.heroku.com/articles/http-routing). 

When a Dyno is started, it gets a copy of the files that it was deployed with in its ephemeral file system. So if your app serves dynamic content from a CMS \(as is the case with [WPSPA](http://github.com/localnerve/wpspa)\), anytime your Dyno starts you get an out-of-date version of the snapshots in the ephemeral file system. In general, managing and serving continually updated content with static html snapshot files will not work on Heroku \(or probably any scalable environment\).

To see this problem further, the snapshots are being taken from a worker process running on a schedule in a short-lived worker Dyno. The worker does not have access or control of the other Dynos, nor should it. So, to make the snapshots available to web Dynos, they have to be stored in a commonly accessible area \(accessible to worker and web Dynos\), and persist when any or all of them are destroyed. For [WPSPA](http://github.com/localnerve/wpspa), I chose to store them in Redis.

### ExpressJS
The snapshots produced by [html-snapshots](https://github.com/localnerve/html-snapshots) are served by custom [ExpressJS](http://expressjs.com/) middleware. The middleware checks to see if it has received an \_escaped\_fragment\_ request. If it has, it retreives the snapshot from Redis and sends it to the client.

> Middleware code: [wpspa/server/middleware/snapshots.js](https://github.com/localnerve/wpspa/blob/master/server/middleware/snapshots.js)

The snapshots middleware is loaded higher in the stack, and an example of that placement \(in relation to other things\) can be found in the [WPSPA](http://github.com/localnerve/wpspa) main application file.

> Application code: [wpspa/app.js](https://github.com/localnerve/wpspa/blob/master/app.js)

### NodeJS Worker
A NodeJS worker process runs periodically to update the html snapshots with content updates from the CMS. I call it the [snapshots](https://github.com/localnerve/wpspa/blob/master/server/workers/snapshots/lib/index.js) worker process. To do this, it gets the actual routes used in the application, produces the snapshots for them using [html-snapshots](https://github.com/localnerve/html-snapshots), then stores them in Redis to be served later on request by the ExpressJS middleware. Actually, the snapshots worker doesn't get the application routes itself, because that task alone is a handy, reusable thing. As such, that task was factored out into its own worker process called [routes](https://github.com/localnerve/wpspa/blob/master/server/workers/routes/lib/index.js).
The [routes](https://github.com/localnerve/wpspa/blob/master/server/workers/routes/lib/index.js) worker process runs the [WPSPA](http://github.com/localnerve/wpspa) app on the server, waits for it to load up in PhantomJS, then asks it what it thinks its application routes are. It then stores those routes in Redis for consumption by the [snapshots](https://github.com/localnerve/wpspa/blob/master/server/workers/snapshots/lib/index.js) worker process as described above. \(The dynamic routes are also consumed by other typical web server things, like a dynamic robots.txt and sitemap.xml\).

> Snapshots worker code: [snapshots](https://github.com/localnerve/wpspa/blob/master/server/workers/snapshots/lib/index.js)

> Routes worker code: [routes](https://github.com/localnerve/wpspa/blob/master/server/workers/routes/lib/index.js)

## Process Limit
I eat my own dogfood. That's how I find out about things sometimes, and this project was no exception. Using [html-snapshots](https://github.com/localnerve/html-snapshots) on Heroku is how I found out that unconditionally spawning processes for each application route is a not-so-good feature to have. So a while back, I added a limiting [process model](https://github.com/localnerve/html-snapshots/tree/rc-7.1#process-model) and an option to control the size of the process pool, [processLimit](https://github.com/localnerve/html-snapshots/blob/master/README.md#process-control-options). For the [WPSPA](http://github.com/localnerve/wpspa) example on Heroku, the [processLimit is set to one](https://github.com/localnerve/wpspa/blob/16c8b5ef2dbea6593572e914f5f3693c0f9f73fc/server/config/config.json#L43) to force only one PhantomJS process to be running at once for the [snapshots](https://github.com/localnerve/wpspa/blob/master/server/workers/snapshots/lib/index.js) worker process, as I run it in a [one-off Dyno](https://devcenter.heroku.com/articles/one-off-dynos), or in the [scheduler](https://addons.heroku.com/scheduler), with a single billable Dyno available to the Heroku account.

## Finally
I hope this brief tour of a Heroku/Redis html-snapshots implementation in [WPSPA](http://github.com/localnerve/wpspa) helped you think about your html snapshot implementation needs.