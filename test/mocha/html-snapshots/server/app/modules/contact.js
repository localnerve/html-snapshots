/*
 * contact.js
 * The view for the contact page
 */
 define([
  "app",
  "modules/page",
  "plugins/text!../templates/contact-fail.html",
  "plugins/text!../templates/contact-success.html",
  "module"
],
function(app, page, failTemplate, successTemplate, module){
  var $d = document,
      $m = window.Modernizr;

  var contactModule = app.module();

  // the contact model definition
  contactModule.Model = Backbone.Model.extend({
    id: module.config().resource,
    urlRoot: module.config().endpoint
  });

  // contact view
  contactModule.View = Backbone.View.extend({
    template: "contact",
    id: "dynamic-content",
    contentId: "contact-content",
    formId: "contact-form",

    events: {
      "click #submit": "submit"
    },

    serialize: function() {
      this.pageData = page.data("contact");
      return {
        //art: data.mainArt,
        contentId: this.contentId,
        formId: this.formId
      };
    },

    afterRender: function() {
      page.afterRender();

      // focus on the first input element - fallback only
      $("input").filter(":first").focus();
    },

    // create a new model, disconnect the old one if it exists
    createModel: function() {
      if (this.model)
        this.stopListening(this.model);
      this.model = new contactModule.Model();

      // wire up request, sync, and error
      this.listenTo(this.model, "request", this.send);
      this.listenTo(this.model, "sync", this.sync);
      this.listenTo(this.model, "error", this.fail);
      return this.model;
    },

    // making the request, so show the spinner
    send: function() {
      if (!this.finished)
        $("#"+this.contentId).html("<div class='page-spinner'></div>");
    },

    // model is synchronized
    sync: function() {
      this.finished = true;

      // api returns the error property
      var error = this.model.get("error");
      if (!error)
        $("#"+this.contentId).html(
          _.template(successTemplate, {
            name: this.model.get("Name"),
            email: this.model.get("Email"),
            responseTime: this.pageData.responseTime
          }));
      else {
        console.log("Error submitting contact form: "+error.reason);
        this.fail();
      }
    },

    // we failed
    fail: function() {
      this.finished = true;
      $("#"+this.contentId).html(
        _.template(failTemplate, {
          message: this.model.get("Message"),
          mailTo: this.pageData.mailTo
        }));
    },

    // handle the submit button
    submit: function() {
      var form = $d.getElementById(this.formId),
          valid = false;

      // cross-browser check validity
      if(typeof form.checkValidity != "undefined")
        valid = form.checkValidity();
      else
        valid = $(form).checkValidity();

      // performs the actual submit
      function doSubmit (self) {
        return function() {
          self.finished = false;

          // get the form input
          var i, formInput = $('[id^="form-"]');

          // make the input data to send
          var input = { Slug: module.config().slug };
          for (i = 0; i < formInput.length; i++)
            input[formInput[i].title] = formInput[i].value;

          // send the data
          self.createModel().save(input);
        };
      }

      if (valid) {
        // call on the leading edge, tossing double-clicks
        _.debounce(doSubmit(this), 500, true)();
        return false;
      }
      // otherwise return nothing so the validation result can present.
    }

  });

  return contactModule;
});