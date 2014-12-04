var assert = require("assert");

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