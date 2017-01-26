/*
 * render.js
 * Runs render code.
 * If the browser requires polyfill:
 *  Load the polyfiller, run the render, then polyfill it.
 * Otherwise, just run the render code.
 */
define([
  "require",
  "app",
  "module"
],
function (require, app, module) {
  var $m = window.Modernizr,
      $n = window.navigator,
      renderModule = app.module();

  var hasCanvas = $m.canvas,
      hasForms = $m.input && $m.inputtypes && $m.formvalidation,
      hasBoxsizing = $m.boxsizing,
      phantom = $n.userAgent.match(/phantom/i),

      // the main polyfill policy
      poly = (!hasCanvas || !hasForms) && !phantom;

  var render = function(fn, context) {
    if (poly) {
      // dynamically load the polyfiller, also load oldie if they don't support boxsizing
      require(["plugins/cload!"+!hasBoxsizing+"?plugins/oldie", "polyfiller"], function(oldie) {
        $.webshims.setOptions({
          waitReady : false,
          disableShivMethods: false,
          basePath: module.config().polyfillerBasePath,
          canvas: {
            type: "excanvas"
          }
        });
        // set the features
        var features = !hasForms ? ["forms"] : [];
        if (!hasCanvas)
          features.push("canvas");

        // start polyfilling
        $.webshims.polyfill(features.join(" "));

        // when DOM ready and webshims ready run fn
        $(function(){
          $.webshims.ready(features.join(" ")+" DOM", function(){
            // if the browser does not support box sizing, setup an after render call to the oldie poly
            var opts = hasBoxsizing ? {} : { afterRender: oldie.all };
            fn.call(context, opts);
          });
        });
      });
    } else {
      // no poly so just run fn
      fn.call(context);
    }
  };

  renderModule.run = function(fn, context) {
    render(fn, context);
  };

  return renderModule;
});