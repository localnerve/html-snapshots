/**
 * Create a local web server for tests
 */
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

module.exports = {

  start: function(rootDir, port, end) {
    http.createServer(function(request, response) {

      var uri = url.parse(request.url).pathname,
          filename = path.join(rootDir, uri);

      fs.exists(filename, function(exists) {
        if(!exists) {
          response.writeHead(404, {"Content-Type": "text/plain"});
          response.write("404 Not Found\n");
          response.end();
          return;
        }

        if (fs.statSync(filename).isDirectory()) filename += '/index.html';

        fs.readFile(filename, "binary", function(err, file) {
          if(err) {
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(err + "\n");
            response.end();
            if (typeof end === "function")
              setTimeout(end, 1000);
            return;
          }

          response.writeHead(200);
          response.write(file, "binary");
          response.end();
          if (typeof end === "function")
            setTimeout(end, 1000);
        });
      });
    }).listen(parseInt(port, 10));
  }
};