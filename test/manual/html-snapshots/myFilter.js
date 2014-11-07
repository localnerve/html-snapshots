//
// Add a custom tag onto the body
//
module.exports = function(content) {
  return content.replace(/<body\b\s/i, "<body data-someattrZZQy=\"true\" ");
}