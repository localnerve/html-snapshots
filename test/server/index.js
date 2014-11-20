/**
 * Create a local web server for tests
 */
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

// this is crazy over-simple, gotta switch to connect...
function contentType(ext) {
  var ct = "text/html";
  if (ext === ".xml")
    ct = "text/xml";
  else if (ext === ".txt")
    ct = "text/plain";
  return ct;
}

module.exports = {

  start: function(rootDir, port, end) {
    http.createServer(function(request, response) {

      var uri = url.parse(request.url).pathname,
          filename = path.join(rootDir, uri),
          extname = path.extname(filename);

      fs.exists(filename, function(exists) {
        if(!exists) {
          response.writeHead(404, {"content-type": "text/plain"});
          response.write("404 Not Found\n");
          response.end();
          return;
        }

        if (fs.statSync(filename).isDirectory()) filename += '/index.html';

        fs.readFile(filename, "binary", function(err, file) {
          if(err) {
            response.writeHead(500, {"content-type": "text/plain"});
            response.write(err + "\n");
            response.end();
            if (typeof end === "function")
              setTimeout(end, 1000);
            return;
          }

          response.writeHead(200, {"content-type": contentType(extname)});
          response.write(file, "binary");
          response.end();
          if (typeof end === "function")
            setTimeout(end, 1000);
        });
      });
    }).listen(parseInt(port, 10));
  }
};