import plugin from './babel-plugin'
import pluginTester from 'babel-plugin-tester'

const input = 'import { ADD, DONE, DELETE } from "./mutation-types";'

pluginTester({
  plugin,
  snapshot: true,
  tests: [
    {
      title: 'try-s2s-vuex-201801',
      code: input
    }
  ]
})
