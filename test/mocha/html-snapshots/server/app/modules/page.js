/*
 * page.js
 *
 * The common page module
 * Loads the page data
 * Defines page events
 * Exports common page tasks
 */
define([
  "app",
  "modules/art",
  "foundation/init",
  "plugins/text!../data/pageData.json",
  "plugins/text!../templates/modal.html"
],
function(app, art, foundation, pageDataJson, modalTemplate) {
  // get a module
  var module = app.module();

  // hydrate the page data
  var pageData = $.parseJSON(pageDataJson);

  // this module's events
  module.Events = {
    page: "data",
    notfound: "404"
  };

  // prepare modal dialogs
  module.modalRender = function(images) {
    var i;
    for (i = 0; i < images.length; i++) {
      if ($("#"+images[i].revealId).length===0)
        $("body").append(_.template(modalTemplate, { image: images[i] }));
    }
  };

  // General utility function to pull a property value(s) from a css style
  // temporarily inject the DOM with the style, and pull the properties
  module.css = function(style, prop) {
    var i, tmp,
        multi = _.isArray(prop),
        value = [],
        props =  multi ? prop : [prop];

    tmp = $("<div class='"+style+"'/>").appendTo("body");

    for (i = 0; i < props.length; i++)
      value.push(props[i].call(tmp));

    tmp.remove();

    return multi ? value : value[0];
  };

  // access any page data, trigger the page data event
  module.data = function(page, options) {
    var result, e;
    options = options || {};

    if (options.type) {
      result = _.findWhere(pageData, { type: options.type, name: page });
    } else {
      result = pageData[page];
    }
    e = module.Events.page;

    // if the page is not found, trigger the notfound event
    if (!result) {
      e = module.Events.notfound;
      result = page;
    }

    this.trigger(e, result);
    return result;
  };

  // access service page data only
  module.service = function(page) {
    return module.data(page, { type: "service" });
  };

  // common afterRender
  // called by pages that need foundation init and optional art
  module.afterRender = function(options) {
    foundation.initialize();
    art.draw(options);
  };

  // return the service navigation
  module.serviceNavigation = function() {
    var nav = {};
    var services = _.where(pageData, { type: "service" });
    for (var k in services) {
      nav[k] = {
        url: services[k].url,
        name: services[k].displayName
      };
    }
    return nav;
  };

  _.extend(module, Backbone.Events);
  return module;
});
