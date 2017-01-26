/**
 * oldie.js
 *
 * Contains polyfills for old IE.
 * Depends on JQuery.
 *
 * box-sizing, border-box polyfill
 *
 **/
define([], function() {
  $d = document;

  var orbit = function(height) {
    $("#featured-orbit").on("loadComplete", function() {
      $(".orbit-wrapper").css("height", height);
      $("#featured-orbit").css("height", height);
    });
  };

  var zIndex = function() {
     var zIndexNumber = 1000;
     // Put your target element(s) in the selector below!
     $("div").each(function() {
        $(this).css("zIndex", zIndexNumber);
        zIndexNumber -= 10;
     });
  };

  var borderBoxModel = function(elements, value) {
    var element, cs, s, i, max,
        fullW, actualW, newW;

    // cycle through all DOM elements
    for (i = 0, max = elements.length; i < max; i++) {
      element = elements[i];
      switch (element.nodeName) {
        case '#comment':
        case 'HTML':
        case 'HEAD':
        case 'TITLE':
        case 'SCRIPT':
        case 'NOSCRIPT':
        case 'STYLE':
        case 'LINK':
        case 'META':
          continue;
        default:
          break;
      }

      s = element.style;
      cs = element.currentStyle;

      // check if box-sizing is specified and is equal to border-box
      if(s.boxSizing == value || s["box-sizing"] == value ||
         cs.boxSizing == value || cs["box-sizing"] == value) {
        fullW = $(element).outerWidth(),
        actualW = $(element).width(),
        newW = actualW - (fullW - actualW);
        $(element).css("width", newW);
      }
    }
  };

  return {
    borderBoxModel: function() { borderBoxModel($d.getElementsByTagName('*'), 'border-box'); },
    zIndex: function() { zIndex(); },
    all: function() {
      borderBoxModel($d.getElementsByTagName('*'), 'border-box');
      zIndex();
      orbit("240px");
    }
  };
});