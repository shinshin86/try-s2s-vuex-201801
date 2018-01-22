// @flow
const tryVuexPlugin = require("./try-vuex-plugin/lib/babel-plugin-compiled.js").default;

module.exports = {
  watch: './**/**/*.js',
  plugins: [
    {
    test: /index.js$/,
    plugin: [
      tryVuexPlugin
    ]
  }
  ],
}
