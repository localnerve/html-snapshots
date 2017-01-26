/*
 * home.js
 * The view for the home page
 */
define([
  "app",
  "modules/page"
],
function(app, page){
  var module = app.module();

  module.View = Backbone.View.extend({
    template: "home",
    id: "dynamic-content",

    serialize: function() {
      var data = page.data("home");
      var imgProps = page.css("img-ctl-js", [$.fn.width, $.fn.height]);
      return {
        art: data.mainArt,
        artAlt: data.mainArtAlt,
        artWidth: imgProps[0],
        artHeight: imgProps[1]
      };
    },

    afterRender: function() {
      page.afterRender({ art: true, name: "home", page: page });
    }
  });

  return module;
});