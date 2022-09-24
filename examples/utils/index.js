/**
 * Utilities for the examples.
 * Copyright (c) 2013 - 2022, Alex Grant, LocalNerve, contributors
 */
const spawn = require('child_process').spawn;

function cleanupAndExit (failure) {
  var pkill;

  if (failure) {
    if (process.platform === 'win32') {
      process.exit(0);
    } else {
      // kill any lingering phantomjs processes
      pkill = spawn('pkill', ['^phantomjs$']);
      pkill.on('exit', function () {
        process.exit(0);
      });
    }
  }
}

module.exports = {
  cleanupAndExit
};
