var assert = require("assert");
var util = require("util");

function mustBeError(err) {
  assert.throws(
    function() {
      assert.ifError(err);
    },
    function(err) {
      return !!err;
    }
  );
}

module.exports = {
  mustBeError: mustBeError
};