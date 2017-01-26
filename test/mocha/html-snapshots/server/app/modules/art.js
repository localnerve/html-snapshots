/*
 * art.js
 * Draws all of the artwork for the pages
 */
define([
  "app",
  "modules/spline",
  "waitforimages"
],
function(app, spline, waitForImages){

  var module = app.module();

  var tension = 0.33;

  // bend
  //x: lastCol+(colinc > 0 ? width-lastCol : (lastCol*-1))/2, 
  //y: (rows[i]+rows[i+1])/2

  // if width is 0, then bends left, else right
  var bend = function(pts, width, endX, endY) {
    var bendMax = 40,
        ltrBend,
        startY = pts.pop(),
        startX = pts.pop();
    if (width !== 0 && Math.abs(width-startX) > bendMax)
      ltrBend = bendMax;
    else
      ltrBend = width-startX;
    pts.push(
      startX, startY,
      startX+(width !== 0 ? ltrBend : (startX*-1))/2,
      (startY+endY)/2, endX, endY
    );
  };

  // insert a smoothing point between the last pt and next pt
  var smoothLast = function(pts, nextX, nextY) {
    var lastY = pts.pop(),
        lastX = pts.pop();
    pts.push(lastX, lastY);
    pts.push(lastX+(nextX-lastX)/1.414, lastY+(nextY-lastY)/2);
  };

  // make horizontal variations between the last point and endX
  // squeeze tween points in between
  var variateHorz = function(pts, tween, endX, smoothStart, modulation) {
    var colmod = modulation || 5,
        i, x,
        startY = pts.pop(),
        startX = pts.pop(),
        ltr = startX < endX;
        tp = Math.round(Math.abs(endX - startX) / tween);
    if (smoothStart)
      smoothLast(pts, startX, startY);
    pts.push(startX, startY);
    for (x=startX, i=0; i < tween;
         (ltr ? x+=tp : x-=tp), i++) {
      if (ltr ? x+(tp*1.5) < endX : x-(tp*1.5) > endX)
        pts.push(
          ltr ? x+tp : x-tp,
          startY+(colmod * ((i % 2)===0 ? 1 : -1))
        );
      else
        break;
    }
  };

  // same as variateHorz, but vertical - top down only.
  var variateVertical = function(pts, tween, endY, smoothStart) {
    var colmod = 5,
        i, y,
        startY = pts.pop(),
        startX = pts.pop(),
        tp = Math.round(Math.abs(endY - startY) / tween);
    if (smoothStart)
      smoothLast(pts, startX, startY);
    pts.push(startX, startY);
    for (y=startY, i=0; i < tween; y+=tp, i++) {
      if (y+(tp*1.5) < endY) {
        pts.push(
          startX+(colmod * ((i % 2)===0 ? 1 : -1)),
          y+tp
          );
      }
      else
        break;
    }
  };

  // draw a loop
  var loop = function(pts, startDegree, endDegree, radius, smoothStart) {
    var i, degInc = 45,
        startY = pts.pop(),
        startX = pts.pop();

    if (smoothStart)
      smoothLast(pts, startX, startY);

    pts.push(startX, startY);

    for (i = startDegree; i <= endDegree; i+=degInc) {
      pts.push(
        startX + radius + Math.cos(i * Math.PI/180) * (radius/2),
        startY + radius + Math.sin(i * Math.PI/180) * radius
      );
    }
  };

  // draw a looping coil horizontally
  var coilHorz = function(pts, width) {
    var x, y, radius = 40;
    loop(pts, 315, 595, radius, false);
    y = pts.pop();
    x = pts.pop();
    pts.push(x, y, x+radius, y-(radius/1.414));
    variateHorz(pts, 4, x+width/2, false);
    loop(pts, 315, 595, radius, false);
    y = pts.pop();
    x = pts.pop();
    pts.push(x, y, x+radius, y-(radius/1.414));

  };

  /**
   * makeServicePoints
   * Create the points for the services page.
   */
  var makeServicePoints = function(pts, bp, canvas, page) {
    // offsets to start in art1.jpg
    var initOffsetX = 175;
    var initOffsetY = 114;

    // make starting point
    var imgDims = page.css("img-ctl-js", [$.fn.width, $.fn.height]);
    var img = $(".image-ctl-inner>img"),
        imgOrigWidth = imgDims[0],
        imgOrigHeight = imgDims[1],
        imgOffsetXAdj = Math.round((img.width()*initOffsetX)/imgOrigWidth),
        imgOffsetYAdj = Math.round((img.height()*initOffsetY)/imgOrigHeight);

    var imgX = img.offset().left + imgOffsetXAdj;
    var imgY = img.offset().top + imgOffsetYAdj;
    pts.push(imgX, imgY);

    // make random kink
    if (!bp) {
      pts.push(imgX+40, imgY);
      pts.push(imgX+100, imgY+80);
    }

    // 1st destination - badges
    var badges = $(".badges-outer"),
        pos = badges.offset(),
        badgesWidth = badges.width(),
        badgesHeight = badges.height(),
        badgesTopOffset = 0;
    if (!bp) {
      pts.push(pos.left, pos.top+badgesHeight);
    }

    // ltr
    if (bp)
      variateHorz(pts, 4, pos.left+badgesWidth, false);
    else
      //coilHorz(pts, canvas.width - pos.left);
      variateHorz(pts, bp ? 4 : 8, pos.left+badgesWidth, false, badgesHeight*2);

    pts.push(pos.left+badgesWidth, pos.top+badgesHeight);

    var footerImgDims = page.css("footer-image-js", [$.fn.width, $.fn.height]);
    var footer = $(".footer-inner"),
        footerImg = $(".footer-image"),
        footerImgImg = $(".footer-image>img"),
        footerOrigWidth = footerImgDims[0],
        footerOrigHeight = footerImgDims[1],
        footerOffsetX = initOffsetX,
        footerOffsetY = initOffsetY,
        footerOffsetXAdj = Math.round((footerImgImg.width()*footerOffsetX)/footerOrigWidth),
        footerOffsetYAdj = Math.round((footerImgImg.height()*footerOffsetY)/footerOrigHeight);

    pos = footer.offset();

      // end at footer
      variateVertical(pts, bp ? 22 : 12, pos.top, bp ? true : false);
      pts.push(pos.left+footer.width(), pos.top);
      pos = footerImg.offset();
      pts.push(pos.left+(footerImg.width()/2)+30, pos.top);
      pts.push(footerImgImg.offset().left+footerOffsetXAdj, footerImgImg.offset().top+footerOffsetYAdj);
    //}
  };

  /**
   * makeHomePoints
   * Create the points for the home page.
   */
  var makeHomePoints = function(pts, bp, canvas, page) {
    // offsets to start in art1.jpg
    var initOffsetX = 175;
    var initOffsetY = 114;

    // make starting point
    var imgDims = page.css("img-ctl-js", [$.fn.width, $.fn.height]);
    var img = $(".image-ctl-inner>img"),
        imgOrigWidth = imgDims[0],
        imgOrigHeight = imgDims[1],
        imgOffsetXAdj = Math.round((img.width()*initOffsetX)/imgOrigWidth),
        imgOffsetYAdj = Math.round((img.height()*initOffsetY)/imgOrigHeight);

    var imgX = img.offset().left + imgOffsetXAdj;
    var imgY = img.offset().top + imgOffsetYAdj;
    pts.push(imgX, imgY);

    // make random kink
    if (!bp) {
      pts.push(imgX+40, imgY);
      pts.push(imgX+100, imgY+80);
    }

    // test loop
    //loop(pts, 90, 405, 50);

    // 1st destination - badges
    var badges = $(".badges-outer"),
        pos = badges.offset(),
        badgesWidth = badges.width(),
        badgesHeight = badges.height(),
        badgesTopOffset = 0;
    if (!bp) {
      pts.push(pos.left, pos.top-badgesTopOffset);
    }
    // ltr
    variateHorz(pts, bp ? 4 : 6, pos.left+badgesWidth, false);
    pts.push(pos.left+badgesWidth, pos.top-badgesTopOffset);
    if (!bp)
      bend(pts, canvas.width, pos.left+badgesWidth, pos.top+badgesHeight-badgesTopOffset);

    var footerImgDims = page.css("footer-image-js", [$.fn.width, $.fn.height]);
    var footer = $(".footer-inner"),
        footerImg = $(".footer-image"),
        footerImgImg = $(".footer-image>img"),
        footerOrigWidth = footerImgDims[0],
        footerOrigHeight = footerImgDims[1],
        footerOffsetX = initOffsetX,
        footerOffsetY = initOffsetY,
        footerOffsetXAdj = Math.round((footerImgImg.width()*footerOffsetX)/footerOrigWidth),
        footerOffsetYAdj = Math.round((footerImgImg.height()*footerOffsetY)/footerOrigHeight);

    pos = footer.offset();

    // end at footer
    variateVertical(pts, bp ? 12 : 6, pos.top, bp ? true : false);
    pts.push(pos.left+footer.width(), pos.top);
    pos = footerImg.offset();
    pts.push(pos.left+(footerImg.width()/2)+30, pos.top);
    pts.push(footerImgImg.offset().left+footerOffsetXAdj, footerImgImg.offset().top+footerOffsetYAdj);

  };

  /**
   * superstition
   * Totally superstitious code that works.
   * Runs some code that causes the UI to complete updating.
   * I'm not sure why, but this works beyond all other measures.
   * Relies on there being an img in the footer and the supporting css.
   * Initial tests showed that doing the math on the object did the trick.
   * NOTE: This just makes it work in screenfly. No evidence to support this 
   * is even really required, or that it works in real life - yet.
   */
  var superstition = function(page) {
    var footerImgImg = $(".footer-image>img");
    var footerOrigWidth = page.css("footer-image-js", $.fn.width);
    var footerOrigHeight = page.css("footer-image-js", $.fn.height);
    var footerOffsetXAdj = Math.round((footerImgImg.width()*1)/footerOrigWidth);
    var footerOffsetYAdj = Math.round((footerImgImg.height()*1)/footerOrigHeight);
  };

  /**
   * drawArt
   * Actually draw the art, which is really two splines.
   * Depending on the name, make the appropriate points.
   */
  var drawArt = function(name, page) {

    // yup, I'm really doing this.
    superstition(page);

    var canvas = document.getElementById("canvas-section");
    var container = $(canvas).parent();
    canvas.width = container.width();
    canvas.height = container.height();

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(1.0, 1.0);

    var bp = page.css("small-breakpoint-js", $.fn.width),
        breakpoint = $(window).width() <= bp,
        pts = [];

    switch (name) {
      case "home":
        makeHomePoints(pts, breakpoint, canvas, page);
        break;
      case "service":
        makeServicePoints(pts, breakpoint, canvas, page);
        break;
      default:
        break;
    }

    spline.draw(ctx, pts, tension, 12, "#020202");
    spline.draw(ctx, pts, tension, 10, "#de8938");
  };


  /**
   * drawAdjust
   * Adjust the art if a window resize has actually occurred.
   */
  var drawAdjust = function(name, page) {
    var winWidth = $(window).width(),
        winHeight = $(window).height();

    // return the resize handler
    return function () {
      var newWinWidth = $(window).width(),
          newWinHeight = $(window).height();

      if (newWinWidth != winWidth || newWinHeight != winHeight) {
        winWidth = newWinWidth;
        winHeight = newWinHeight;
        //_.defer(function() { drawArt(name, page); });
        _.defer(function() { $("#main").waitForImages(loaded(name, page), $.noop, true); });
      }
    };
  };

  /**
   * loaded
   * Return the ImageLoaded handler
   */
  var loaded = function(name, page) {
    return function() {
        drawArt(name, page);
    };
  };

  /**
   * draw
   * If the options indicate that there is art, setup to draw the art.
   * Otherwise, clear the art.
   */
  module.draw = function(options) {
    var opts = options || {};
    if (opts.art) {
      // loaded returns the image load handler
      $("#main").waitForImages(loaded(opts.name, opts.page), $.noop, true);
      // resize handler
      $(window).off("resize").on("resize",
        // drawAdjust returns the handler to run after 100ms
        _.debounce(drawAdjust(opts.name, opts.page), 100)
      );
    } else {
      var canvas = document.getElementById("canvas-section");
      var ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      $(window).off("resize");
    }
  };

  return module;
});