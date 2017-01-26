// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file and the JamJS
  // generated configuration file.
  deps: ["../vendor/jam/require.config", "main"],

  paths: {

    // Use the underscore build of Lo-Dash to minimize incompatibilities.
    "lodash": "../vendor/jam/lodash/dist/lodash.underscore",

    // JavaScript folders.
    plugins: "../vendor/js/plugins",
    vendor: "../vendor",

    // shortcut to foundation
    foundation: "../vendor/foundation",

    polyfiller: "../vendor/js/libs/webshim/minified/polyfiller"

  },

  config: {
    "modules/contact": {
      // these have to match the api
      endpoint: "/api",
      resource: "contact",
      slug: "NORTHSTAR86i23a03pZ"
    },
    "modules/render": {
      polyfillerBasePath: "/vendor/js/libs/webshim/minified/shims/"
    }
  },

  map: {
    // Ensure Lo-Dash is used instead of underscore.
    "*": { "underscore": "lodash" }

    // Put additional maps here.
  },

  shim: {

    "foundation/jquery.event.move": {
      deps: ["jquery"]
    },
    "foundation/jquery.event.swipe": {
      deps: ["jquery"]
    },

    "foundation/jquery.foundation.orbit.ln": {
      deps: ["jquery"]
    },
    "foundation/init": {
      deps: ["jquery"]
    },
/*    
    "foundation/jquery.foundation.mediaQueryToggle": {
      deps: ["jquery"]
    },
*/
    "foundation/jquery.foundation.navigation.ln" : {
      deps: ["jquery"]
    },
    "foundation/jquery.placeholder": {
      deps: ["jquery"]
    },
    "foundation/jquery.foundation.reveal": {
      deps: ["jquery"]
    }
  }

});
