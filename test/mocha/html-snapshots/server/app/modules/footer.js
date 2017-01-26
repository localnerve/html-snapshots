/*
 * footer.js
 * The view for the footer
 */
 define([
  "app",
  "modules/page"
],
function(app, page){
  var module = app.module();

  var theDate = new Date();

  module.View = Backbone.View.extend({
    template: "footer",
    initialize: function() {
      page.on(page.Events.page, this.updateView, this);
    },

    serialize: function() {
      var data = page.data("footer");
      var imgProps = page.css("footer-image-js", [$.fn.width, $.fn.height]);
      return {
        art: data.mainArt,
        artAlt: data.mainArtAlt,
        artWidth: imgProps[0],
        artHeight: imgProps[1],
        copyYear: theDate.getFullYear()
      };
    },

    updateView: function(data) {
      // update the view with the page data
      // maybe footer can be static?
    }
  });

  return module;
});