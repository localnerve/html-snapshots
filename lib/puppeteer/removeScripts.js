/**
 * Remove all script tags from content
 */
function removeScriptTags (content) {
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

module.exports = removeScriptTags;