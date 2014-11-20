//
// Add a custom tag onto the body
//
module.exports = function(content) {
  console.log("IN THE CUSTOMFILTER");
  return content.replace(/<body\b\s*/i, "<body data-someattrZZQy=\"true\" ");
};