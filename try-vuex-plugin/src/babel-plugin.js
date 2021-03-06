import template from 'babel-template'
import * as t from 'babel-types'
import generate from 'babel-generator'
import { writeFileSync } from 'fs'
import { join } from 'path'

// importリスト
let importNameList = []

// 対象ディレクトリ
const storeDir = join('..', '..', 'src', 'store')

// 対象テストディレクトリ
const storeSpecDir = join('..', '..', 'test')

// 生成用テンプレート
const builder = code => {
  return template(code, { sourceType: 'module' })
}

/* newVuexBuilder */
const newVuexBuilder = () => {
  const b = builder(`
  export default new Vuex.Store({
    state,
    getters,
    actions,
    mutations
  })
  `)
  return b()
}

/* mutationTypesBuilder */
const mutationTypesBuilder = codeObj => {
  const b = builder(`export const ACTION_NAME = ACTION_STR`)
  return b(codeObj)
}

/* stateInitilize */
const stateInitilize = () => {
  const b = builder(`
    const state = {
    }
    `)
  return b()
}

/* gettersInitilize */
const gettersInitilize = () => {
  const b = builder(`
    const getters = {
    }`)
  return b()
}

/* actionsInitilize */
const actionsInitilize = actionsCount => {
  let codes = []
  const method = `
      [ACTION_NAME] ({ commit }, state) {
        commit(ACTION_NAME, state)
      }
  `
  const beforeCode = 'const actions = {'
  const afterCode = '}'

  for (let i = 0; i < actionsCount; i++) {
    codes.push(method)
  }
  const buildCode = beforeCode + codes.join(',') + afterCode

  const b = builder(buildCode)
  return b()
}

/* storeImportBuilder */
const storeImportBuilder = () => {
  const code = `
    import store from '../src/store/index'
  `
  const b = builder(code)
  return generate(b()).code
}

/* storeDispatchBuilder */
const storeDispatchBuilder = () => {
  const code = `
    const dispatch = store.dispatch
  `
  const b = builder(code)
  return generate(b()).code
}

/* storeCommitBuilder */
const storeCommitBuilder = () => {
  const code = `
    const commit = store.commit
  `
  const b = builder(code)
  return generate(b()).code
}

/* storeGettersBuilder */
const storeGettersBuilder = () => {
  const code = `
    const getters = store.getters
  `
  const b = builder(code)
  return generate(b()).code
}

/* specImportBuilder */
const specImportBuilder = actionNames => {
  let codes = []
  const beforeCode = 'import {'
  const afterCode = "} from '../src/store/mutation-types'"

  actionNames.forEach(v => {
    codes.push(v)
  })

  const buildCode = beforeCode + codes.join(',') + afterCode

  const b = builder(buildCode)

  return generate(b()).code
}

/* specInitilize */
const specInitilize = actionNames => {
  let generateCode = []
  const names = getNames(actionNames)

  generateCode.push(storeImportBuilder())
  generateCode.push(specImportBuilder(names))
  generateCode.push(storeDispatchBuilder())
  generateCode.push(storeCommitBuilder())
  generateCode.push(storeGettersBuilder())

  const methods = ['actions', 'mutations', 'getters']
  methods.forEach(method => {
    generateCode.push(generateSpecCode(method, names))
  })
  return generateCode
}

const generateSpecCode = (method, names) => {
  const beforeCode = `
    describe(${method}, () => {
    `
  const afterCode = `
    })
    `
  let codes = []
  if (method !== 'getters') {
    names.forEach(v => {
      codes.push(`
        it('${v}', () => {
        })
        `)
    })
  }

  const buildCode = beforeCode + codes.join('') + afterCode
  const b = builder(buildCode)
  return generate(b()).code
}

const getNames = actionNames => {
  let names = []
  actionNames.forEach((action, idx) => {
    names.push(actionNames[idx].imported.name)
  })
  return names
}

/* mutationsInitilize */
const mutationsInitilize = actionsCount => {
  let codes = []
  const method = `
      [ACTION_NAME] (state) {
        state = state
      }
  `
  const beforeCode = 'const mutations = {'
  const afterCode = '}'

  for (let i = 0; i < actionsCount; i++) {
    codes.push(method)
  }
  const buildCode = beforeCode + codes.join(',') + afterCode

  const b = builder(buildCode)
  return b()
}

export default () => {
  return {
    name: ' try-s2s-vuex-201801',
    visitor: {
      ImportDeclaration: path => {
        // TODO: 制御について改善が必要
        // 保存時にコードの初期化が行われてしまうため、使用しない
        // if(path.container.length === 6) {
        //  path.container.length = 1
        // }

        if (path.container.length !== 6) {
          // action定義数
          const actionsCount = path.node.specifiers.length

          // 書き込み先のファイル名("src/store/mutation-types.js")を取得
          const filepath = join(
            __dirname,
            storeDir,
            path.node.source.value + '.js'
          )

          // mutationTypes内のコードを保持
          const mutationTypesCode = []

          // new Vuexの生成
          path.insertAfter(newVuexBuilder())

          // vuexのテンプレートを記述
          path.insertAfter(gettersInitilize())
          path.insertAfter(mutationsInitilize(actionsCount))
          path.insertAfter(actionsInitilize(actionsCount))
          path.insertAfter(stateInitilize())

          // importリストを初期化
          importNameList.length = 0

          path.node.specifiers.forEach(n => {
            importNameList.push(n.imported.name)
            const buildAst = mutationTypesBuilder({
              ACTION_NAME: t.identifier(n.imported.name),
              ACTION_STR: t.StringLiteral(n.imported.name)
            })

            // mutationTypes.js用のコードを追加していく
            mutationTypesCode.push(generate(buildAst).code)
          })

          // "mutation-types.js"に書き込み
          writeFileSync(filepath, mutationTypesCode.join('\n'))

          // 書き込み先のファイル名("test/index.spec.js")
          const specPath = join(__dirname, storeSpecDir, 'index.spec.js')

          // テスト生成
          writeFileSync(
            specPath,
            specInitilize(path.node.specifiers).join('\n')
          )
        }
      },

      // 書き出したactions, mutationsの内容を、定義したactionに書き換えていく
      VariableDeclaration: path => {
        path.node.declarations.forEach(n1 => {
          if (n1.id.name === 'actions') {
            path.node.declarations.forEach(d => {
              d.init.properties.forEach((n, i) => {
                d.init.properties[i].key.name = importNameList[i]
                d.init.properties[i].body.body[0].expression.arguments[0].name =
                  importNameList[i]
              })
            })
          }
          if (n1.id.name === 'mutations') {
            path.node.declarations.forEach(d => {
              d.init.properties.forEach((n, i) => {
                d.init.properties[i].key.name = importNameList[i]
              })
            })
          }
        })
      }
    }
  }
}
