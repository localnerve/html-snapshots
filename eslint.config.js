 
const js = require("@eslint/js");
const globals = require("globals");
const nodePlugin = require("eslint-plugin-n");

const nodeRules = nodePlugin.configs["flat/recommended"].rules;

module.exports = [{
  ignores: [
    "tmp/**",
    "coverage/**",
    "examples/**",
    "test/suites/html-snapshots/server/**"
  ]
}, {
  plugins: { n: nodePlugin },
  name: "process-entry",
  files: [
    "lib/{puppeteer,playwright}/index.js"
  ],
  languageOptions: {
    sourceType: "commonjs",
    globals: {
      ...globals.node
    }
  },
  rules: {
    ...js.configs.recommended.rules,
    ...nodeRules,
    "n/hashbang": 0
  }
}, {
  plugins: { n: nodePlugin },
  name: "lib-test",
  files: [
    "**/*.js"
  ],
  ignores: [
    "lib/playwright/index.js",
    "lib/puppeteer/index.js"
  ],
  languageOptions: {
    sourceType: "commonjs",
    globals: {
      ...globals.node
    }
  },
  rules: {
    ...js.configs.recommended.rules,
    ...nodeRules,
    "no-console": 0,
    "quotes": ["error", "double"]
  }
}];
