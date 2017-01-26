define([
  "foundation/jquery.event.move",
  "foundation/jquery.event.swipe"
],
function () {
  'use strict';
  var $w = window,
      $doc = $(document),
      Modernizr = $w.Modernizr,
      sentinel = false;

  var initialize = function() {
    //if (!sentinel) {
    //  sentinel = true;
      $.fn.foundationAlerts           ? $doc.foundationAlerts() : null;
      $.fn.foundationButtons          ? $doc.foundationButtons() : null;
      $.fn.foundationAccordion        ? $doc.foundationAccordion() : null;
      $.fn.foundationNavigation       ? $doc.foundationNavigation() : null;
      $.fn.foundationTopBar           ? $doc.foundationTopBar() : null;
      $.fn.foundationCustomForms      ? $doc.foundationCustomForms() : null;
      $.fn.foundationMediaQueryViewer ? $doc.foundationMediaQueryViewer() : null;
      $.fn.foundationTabs             ? $doc.foundationTabs({callback : $.foundation.customForms.appendCustomMarkup}) : null;
      $.fn.foundationTooltips         ? $doc.foundationTooltips() : null;
      $.fn.foundationMagellan         ? $doc.foundationMagellan() : null;
      $.fn.foundationClearing         ? $doc.foundationClearing() : null;

      $.fn.placeholder                ? $('input, textarea').placeholder() : null;
    //}
  };

  // UNCOMMENT THE LINE YOU WANT BELOW IF YOU WANT IE8 SUPPORT AND ARE USING .block-grids
  // $('.block-grid.two-up>li:nth-child(2n+1)').css({clear: 'both'});
  // $('.block-grid.three-up>li:nth-child(3n+1)').css({clear: 'both'});
  // $('.block-grid.four-up>li:nth-child(4n+1)').css({clear: 'both'});
  // $('.block-grid.five-up>li:nth-child(5n+1)').css({clear: 'both'});

  // Hide address bar on mobile devices (except if #hash present, so we don't mess up deep linking).
  if (Modernizr.touch && !$w.location.hash) {
    $(window).load(function () {
      setTimeout(function () {
        // At load, if user hasn't scrolled more than 20px or so...
  			if( $w.scrollTop() < 20 ) {
          $(window).scrollTo(0, 1);
        }
      }, 0);
    });
  }

  return { initialize: initialize };
});
