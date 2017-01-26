;(function ($, window, undefined) {
  'use strict';

  $.fn.foundationNavigation = function (options) {

    var handler, lockNavBar = false;
    // Windows Phone, sadly, does not register touch events :(
    if (Modernizr.touch || navigator.userAgent.match(/Windows Phone/i)) {
      handler = function (e) {
        e.preventDefault();
        var flyout = $(this).siblings('.flyout').first();
        if (lockNavBar === false) {
          $('.nav-bar .flyout').not(flyout).slideUp(500);
          flyout.slideToggle(500, function () {
            lockNavBar = false;
          });
        }
        lockNavBar = true;
      };
      $(document).off('click.fndtn touchstart.fndtn', '.nav-bar a.flyout-toggle');
      $(document).on('click.fndtn touchstart.fndtn', '.nav-bar a.flyout-toggle', handler);
      $('.nav-bar>li.has-flyout', this).addClass('is-touch');
    } else {
      handler = function (e) {
        if (e.type == 'mouseenter') {
          $('.nav-bar').find('.flyout').hide();
          $(this).children('.flyout').show();
        }

        if (e.type == 'mouseleave') {
          var flyout = $(this).children('.flyout'),
              inputs = flyout.find('input'),
              hasFocus = function (inputs) {
                var focus;
                if (inputs.length > 0) {
                  inputs.each(function () {
                    if ($(this).is(":focus")) {
                      focus = true;
                    }
                  });
                  return focus;
                }

                return false;
              };

          if (!hasFocus(inputs)) {
            $(this).children('.flyout').hide();
          }
        }
      };
      $('.nav-bar>li.has-flyout', this).off('mouseenter mouseleave');
      $('.nav-bar>li.has-flyout', this).on('mouseenter mouseleave', handler);
    }

  };

})( jQuery, this );
