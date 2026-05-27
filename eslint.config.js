const js = require("@eslint/js");
const globals = require("globals");

module.exports = [{
  ignores: [
    "tmp/**",
    "coverage/**",
    "examples/**",
    "test/suites/html-snapshots/server/**",
    "lib/phantom/modules/*"
  ]
}, {
  languageOptions: {
    sourceType: "commonjs",
    globals: {
      ...globals.node
    }
  },
  files: ["**/*.js"],
  rules: {
    ...js.configs.recommended.rules,
    "no-console": 0,
    "quotes": ["error", "double"]
  }
}];
