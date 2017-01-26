/*
 * header.js
 * The view for the header
 */
define([
  "app",
  "modules/page",
  "foundation/jquery.foundation.navigation.ln",
  "foundation/jquery.foundation.orbit.ln"
],
function(app, page){
  var $d = document;//,
      //$m = window.Modernizr;

  //var mq = $m.mq("only all");

  var module = app.module();

  module.View = Backbone.View.extend({
    template: "header",
    orbitId: "featured-orbit",

    initialize: function() {
      page.on(page.Events.page, this.updateView, this);
      this.services = page.serviceNavigation();
      this.contact = page.data("contact");
    },

    serialize: function() {
      var imgProps = page.css("logo-img-js", [$.fn.width, $.fn.height]);
      return {
        orbitId: this.orbitId,
        services: this.services,
        contact: this.contact,
        logoWidth: imgProps[0],
        logoHeight: imgProps[1]
      };
    },

    updateView: function(data) {
      // update the head elements
      $d.title = data.pageTitle;
      $("meta[name=description]").attr("content", data.pageDescription);
      $("meta[name=keywords]").attr("content", data.pageKeywords);

      this.data = data;
    },

    afterRender: function() {
      // update the slides      
      var orbit = this.$("#"+this.orbitId).empty();
      if (this.data && this.data.slides) {
        var i;
        for (i = 0; i < this.data.slides.length; i++)
          orbit.append($("<div></div>")
            .addClass(this.data.slides[i].cssclass)
            .append(this.data.slides[i].content)
          );
      }
      var fluid = "47x24";//mq ? "47x24" : false;
      orbit.orbit({ fluid: fluid, advanceSpeed: 8000, captions: false, bullets: false,
        afterLoadComplete: function(){
          orbit.trigger("loadComplete");
        } });
    }

  });

  return module;
});