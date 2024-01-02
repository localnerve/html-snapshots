/**
 * Remove all script tags from content
 * 
 * Copyright (c) 2013 - 2024 Alex Grant, LocalNerve, contributors
 * Licensed under the MIT license. 
 */
function removeScriptTags (content) {
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

module.exports = removeScriptTags;