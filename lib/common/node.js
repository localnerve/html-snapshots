/***
 * nodeCall
 *
 * Copyright (c) 2013 - 2021, Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license.
 */
/* global Promise */

/**
 * Utility to promisify a Node function
 *
 * @param {Function} nodeFunc - The node-style function to Promisify.
 */
function nodeCall (nodeFunc, ...nodeArgs) {
  return new Promise((resolve, reject) => {
    nodeArgs.push((err, value) => {
      if (err) {
        return reject(err);
      } 
      return resolve(value);
    });
    nodeFunc.apply(nodeFunc, nodeArgs);
  });
}

module.exports = nodeCall;
