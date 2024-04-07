const js = require('@eslint/js');
const globals = require('globals');

module.exports = [{
  ignores: [
    'tmp/**',
    'coverage/**',
    'examples/**',
    'test/mocha/html-snapshots/server/**'
  ]
}, {
  languageOptions: {
    sourceType: 'commonjs',
    globals: {
      ...globals.node
    }
  },
  files: ["**/*.js"],
  rules: {
    ...js.configs.recommended.rules,
    "no-console": 0
  }
}];
