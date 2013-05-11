var assert = require("assert");

describe('Too Few Arguments', function(){
  it.skip('should present the Usage', function(){
    assert.equal(-1, "../../../lib/cli/html-snapshots 1 2 3 4");
  });
});

describe('Right number, right args', function(){
  it.skip('should give a good result', function(){
    assert.equal(0, "../../../lib/cli/html-snapshots '../../../manual/robots.txt' northstar.local ./tmp/snapshots '#dynamic-content'");
  });
});

describe('Right number, wrong args #1', function() {
  it.skip('should return false because the path to robots is wrong', function() {
    assert.equal(-1, "../../../lib/cli/html-snapshots '../../../manual/r.txt' northstar.local ./tmp/snapshots '#dynamic-content' true");
  });
});