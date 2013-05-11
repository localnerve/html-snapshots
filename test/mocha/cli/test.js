var assert = require("assert");
describe('Too Few Arguments', function(){
  it('should present the Usage', function(){
    assert(-1, "../../../lib/cli/html-snapshots 1 2 3 4");
  });
});

describe('Right number, right args', function(){
  it('should give a true result', function(){
    assert(true, "../../../lib/cli/html-snapshots '../../../manual/robots.txt' northstar.local ./tmp/snapshots '#dynamic-content'");
  });
});

describe('Right number, wrong args #1', function() {
  it('should return false because the path to robots is wrong', function() {
    assert(false, "../../../lib/cli/html-snapshots '../../../manual/r.txt' northstar.local ./tmp/snapshots '#dynamic-content' true");
  });
});