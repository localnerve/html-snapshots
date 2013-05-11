var assert = require("assert");
var ss = require("../../../lib/html-snapshots");

describe("html-snapshots library module", function() {

  describe("No Arguments", function(){
    it("should return false", function(){
      var result = ss.run();
      assert.equal(false, result);
    });
  });

});