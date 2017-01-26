define([
  "app",
  "modules/header",
  "modules/home",
  "modules/service",
  "modules/contact",
  "modules/footer",
  "modules/page",
  "modules/render"
],
function(app, header, home, service, contact, footer, page, render) {

  var $w = window;

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({

    routes: {
      "(/)": "index",
      "services/:service(/)": "service",
      "contact(/)": "contact",
      "*default": "notfound"
    },

    initialize: function() {

      // wire up the page notfound event
      page.on(page.Events.notfound, this.notfound, this);

      // create the main layout views
      var mainLayout = app.useLayout("main-layout");
      var homeView = new home.View();
      var serviceView = new service.View({router: this});
      var contactView = new contact.View();

      // keep references to the views
      _.extend(this, {
        mainLayout: mainLayout,
        home: homeView,
        service: serviceView,
        contact: contactView
      });

      // set the child views, they get notified via page events
      mainLayout.setViews({
        "#header": new header.View(),
        "#footer": new footer.View()
      });
    },

    // default route handler and page notfound handler
    // exits the app to the 404 handler
    notfound: function(path) {
      $w.location.replace("/"+path+".notfound");
    },

    // handle the index route
    index: function() {
      render.run(
        function(options){
          options = options || {};

          // hook up after render
          if (options.afterRender)
            this.mainLayout.once("afterRender", options.afterRender);

          // render the home view
          this.mainLayout.setViews({"#content": this.home}).render();
        }, this
      );
    },

    // handle the service route
    service: function(service) {
      render.run(
        function(options){
          options = options || {};

          // hook up after render
          if (options.afterRender)
            this.mainLayout.once("afterRender", options.afterRender);

          // trigger a service change
          this.trigger("service", {service: service});

          // render the service view
          this.mainLayout.setViews({"#content": this.service}).render();
        }, this
      );
    },

    // handle the contact route
    contact: function() {
      render.run(
        function(options){
          options = options || {};

          // hook up after render
          if (options.afterRender)
            this.mainLayout.once("afterRender", options.afterRender);

          // render the contact view
          this.mainLayout.setViews({"#content": this.contact}).render();
        }, this
      );
    }

  });

  return Router;

});
