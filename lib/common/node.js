/***
 * nodeCall
 *
 * Copyright (c) 2013 - 2016, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/* global Promise */

/**
 * Utility to promisify a Node function
 *
 * @param {Function} nodeFunc - The node function to Promisify.
 */
function nodeCall (nodeFunc /* args... */) {
  var nodeArgs = Array.prototype.slice.call(arguments, 1);

  return new Promise(function (resolve, reject) {
    /**
     * Resolve a node callback
     */
    function nodeResolver (err, value) {
      if (err) {
        reject(err);
      } else if (arguments.length > 2) {
        resolve.apply(resolve, Array.prototype.slice.call(arguments, 1));
      } else {
        resolve(value);
      }
    }

    nodeArgs.push(nodeResolver);
    nodeFunc.apply(nodeFunc, nodeArgs);
  });
}

module.exports = nodeCall;
