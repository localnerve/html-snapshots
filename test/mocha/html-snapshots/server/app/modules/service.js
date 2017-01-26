/*
 * service.js
 * The view for all service pages
 */
define([
  "app",
  "modules/page",
  "foundation/jquery.foundation.reveal"
],
function(app, page){
  var module = app.module();

  module.View = Backbone.View.extend({
    template: "service",
    id: "dynamic-content",

    initialize: function() {
      if (this.options.router)
        this.options.router.on("service", this.service, this);
    },

    // my service changed handler
    service: function(options) {
      options = options || {};
      this.service = options.service;
    },

    serialize: function() {
      this.data = page.service(this.service);
      var imgProps = page.css("img-ctl-js", [$.fn.width, $.fn.height]);
      return {
        art: this.data.mainArt,
        artAlt: this.data.mainArtAlt,
        artWidth: imgProps[0],
        artHeight: imgProps[1],
        images: this.data.images,
        modal: page.modalRender
      };
    },

    afterRender: function() {
      page.afterRender({ art: this.data.vectorArt, name: "service", page: page });
    }
  });

  return module;
});