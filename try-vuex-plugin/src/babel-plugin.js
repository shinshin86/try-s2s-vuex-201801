import template from 'babel-template'
import * as t from 'babel-types'
import generate from 'babel-generator'
import { writeFileSync } from 'fs'
import { join } from 'path'

// importリスト
let importNameList = []

// 対象ディレクトリ
const storeDir = join("..", "..", "src", "store")

// 生成用テンプレート
const builder = (code) => {
  return template(code, { sourceType: 'module' });
}

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


const mutationTypesBuilder = (codeObj) => {
  const b = builder(`export const ACTION_NAME = ACTION_STR`)
  return b(codeObj)
}

const stateInitilize = () => {
  const b = builder(`
    const state = {
    }
    `)
  return b()
}

const gettersInitilize = () => {
  const b = builder(`
    const getters = {
    }`)
  return b()
}

const actionsInitilize = (actionsCount) => {
  let codes = []
  const method = `
      [ACTION_NAME] ({ commit }, state) {
        commit(ACTION_NAME, state)
      }
  `
  const beforeCode = "const actions = {"
  const afterCode = "}"

  for(let i = 0; i < actionsCount; i++) {
    codes.push(method)
  }
  const buildCode = beforeCode
                  + codes.join(',')
                  + afterCode

  const b = builder(buildCode)
  return b()
}

const mutationsInitilize = (actionsCount) => {
  let codes = []
  const method = `
      [ACTION_NAME] (state) {
        state = state
      }
  `
  const beforeCode = "const mutations = {"
  const afterCode = "}"

  for(let i = 0; i < actionsCount; i++) {
    codes.push(method)
  }
  const buildCode = beforeCode
                  + codes.join(',')
                  + afterCode

  const b = builder(buildCode)
  return b()
}

export default () => {
  return {
    visitor: {
      ImportDeclaration: path => {
        if(path.container.length === 6) {
          path.container.length = 1
        }
        if(path.container.length !== 6) {
          // action定義数
          const actionsCount = path.node.specifiers.length;

          // 書き込み先のファイル名("src/store/mutation-types.js")を取得
          const filepath = join(__dirname, storeDir, (path.node.source.value + ".js"))

          // mutationTypes内のコードを保持
          const mutationTypesCode = [];

          // new Vuexの生成
          path.insertAfter(newVuexBuilder())

          // vuexのテンプレートを記述
          path.insertAfter(gettersInitilize())
          path.insertAfter(mutationsInitilize(actionsCount))
          path.insertAfter(actionsInitilize(actionsCount))
          path.insertAfter(stateInitilize())

          // importリストを初期化
          importNameList.length = 0

          path.node.specifiers.forEach((n) => {
            importNameList.push(n.imported.name)
            const buildAst = mutationTypesBuilder({
              ACTION_NAME: t.identifier(n.imported.name),
              ACTION_STR: t.StringLiteral(n.imported.name)
            });

            // mutationTypes.js用のコードを追加していく
            mutationTypesCode.push(generate(buildAst).code)
          })

          // "mutation-types.js"に書き込み
          writeFileSync(filepath, mutationTypesCode.join("\n"))
        }
      },

      // 書き出したactions, mutationsの内容を、定義したactionに書き換えていく
      VariableDeclaration: path => {
        path.node.declarations.forEach((n1) => {
          if(n1.id.name === 'actions') {
            path.node.declarations.forEach((d) => {
              d.init.properties.forEach((n, i) => {
                d.init.properties[i].key.name = importNameList[i]
                d.init.properties[i].body.body[0].expression.arguments[0].name = importNameList[i]
              })
            })
          }
          if(n1.id.name === 'mutations') {
            path.node.declarations.forEach((d) => {
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

