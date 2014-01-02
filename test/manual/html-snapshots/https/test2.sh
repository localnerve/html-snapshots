#!/bin/bash

# ../../../../node_modules/phantomjs/lib/phantom/bin/phantomjs --ignore-ssl-errors=true --ssl-protocol=any --debug=true ./mysnapshotscript.js ./snapshot1.html 'https://www.google.de/books?hl=de' body 6000 500

../../../../node_modules/phantomjs/lib/phantom/bin/phantomjs --debug=true ./mysnapshotscript.js ./snapshot1.html 'http://www.google.de/books' body 6000 500