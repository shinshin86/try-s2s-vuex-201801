'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _babelTemplate = require('babel-template');

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

var _babelGenerator = require('babel-generator');

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _fs = require('fs');

var _path = require('path');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// importリスト
var importNameList = [];

// 対象ディレクトリ
var storeDir = (0, _path.join)("..", "..", "src", "store");

// 対象テストディレクトリ
var storeSpecDir = (0, _path.join)("..", "..", "test");

// 生成用テンプレート
var builder = function builder(code) {
  return (0, _babelTemplate2.default)(code, { sourceType: 'module' });
};

var newVuexBuilder = function newVuexBuilder() {
  var b = builder('\n  export default new Vuex.Store({\n    state,\n    getters,\n    actions,\n    mutations\n  })\n  ');
  return b();
};

var mutationTypesBuilder = function mutationTypesBuilder(codeObj) {
  var b = builder('export const ACTION_NAME = ACTION_STR');
  return b(codeObj);
};

var stateInitilize = function stateInitilize() {
  var b = builder('\n    const state = {\n    }\n    ');
  return b();
};

var gettersInitilize = function gettersInitilize() {
  var b = builder('\n    const getters = {\n    }');
  return b();
};

var actionsInitilize = function actionsInitilize(actionsCount) {
  var codes = [];
  var method = '\n      [ACTION_NAME] ({ commit }, state) {\n        commit(ACTION_NAME, state)\n      }\n  ';
  var beforeCode = "const actions = {";
  var afterCode = "}";

  for (var i = 0; i < actionsCount; i++) {
    codes.push(method);
  }
  var buildCode = beforeCode + codes.join(',') + afterCode;

  var b = builder(buildCode);
  return b();
};

var storeImportBuilder = function storeImportBuilder() {
  var code = '\n    import store from \'../src/store/index\'\n  ';
  var b = builder(code);
  return (0, _babelGenerator2.default)(b()).code;
};

var storeDispatchBuilder = function storeDispatchBuilder() {
  var code = '\n    const dispatch = store.dispatch\n  ';
  var b = builder(code);
  return (0, _babelGenerator2.default)(b()).code;
};

var storeCommitBuilder = function storeCommitBuilder() {
  var code = '\n    const commit = store.commit\n  ';
  var b = builder(code);
  return (0, _babelGenerator2.default)(b()).code;
};

var storeGettersBuilder = function storeGettersBuilder() {
  var code = '\n    const getters = store.getters\n  ';
  var b = builder(code);
  return (0, _babelGenerator2.default)(b()).code;
};

var specImportBuilder = function specImportBuilder(actionNames) {

  var codes = [];
  var beforeCode = "import {";
  var afterCode = "} from '../src/store/mutation-types'";

  actionNames.forEach(function (v) {
    codes.push(v);
  });

  var buildCode = beforeCode + codes.join(',') + afterCode;

  var b = builder(buildCode);

  return (0, _babelGenerator2.default)(b()).code;
};

var specInitilize = function specInitilize(actionNames) {
  var generateCode = [];
  var names = getNames(actionNames);

  generateCode.push(storeImportBuilder());
  generateCode.push(specImportBuilder(names));
  generateCode.push(storeDispatchBuilder());
  generateCode.push(storeCommitBuilder());
  generateCode.push(storeGettersBuilder());

  var methods = ["actions", "mutations", "getters"];
  methods.forEach(function (method) {
    generateCode.push(generateSpecCode(method, names));
  });
  return generateCode;
};

var generateSpecCode = function generateSpecCode(method, names) {
  var beforeCode = '\n    describe(' + method + ', () => {\n    ';
  var afterCode = '\n    })\n    ';
  var codes = [];
  if (method !== "getters") {
    names.forEach(function (v) {
      codes.push('\n        it(\'' + v + '\', () => {\n        })\n        ');
    });
  }

  var buildCode = beforeCode + codes.join('') + afterCode;
  var b = builder(buildCode);
  return (0, _babelGenerator2.default)(b()).code;
};

var getNames = function getNames(actionNames) {
  var names = [];
  actionNames.forEach(function (action, idx) {
    names.push(actionNames[idx].imported.name);
  });
  return names;
};

var mutationsInitilize = function mutationsInitilize(actionsCount) {
  var codes = [];
  var method = '\n      [ACTION_NAME] (state) {\n        state = state\n      }\n  ';
  var beforeCode = "const mutations = {";
  var afterCode = "}";

  for (var i = 0; i < actionsCount; i++) {
    codes.push(method);
  }
  var buildCode = beforeCode + codes.join(',') + afterCode;

  var b = builder(buildCode);
  return b();
};

exports.default = function () {
  return {
    visitor: {
      ImportDeclaration: function ImportDeclaration(path) {
        // TODO: 制御について改善が必要
        // 保存時にコードの初期化が行われてしまうため、使用しない
        // if(path.container.length === 6) {
        //  path.container.length = 1
        // }

        if (path.container.length !== 6) {
          // action定義数
          var actionsCount = path.node.specifiers.length;

          // 書き込み先のファイル名("src/store/mutation-types.js")を取得
          var filepath = (0, _path.join)(__dirname, storeDir, path.node.source.value + ".js");

          // mutationTypes内のコードを保持
          var mutationTypesCode = [];

          // new Vuexの生成
          path.insertAfter(newVuexBuilder());

          // vuexのテンプレートを記述
          path.insertAfter(gettersInitilize());
          path.insertAfter(mutationsInitilize(actionsCount));
          path.insertAfter(actionsInitilize(actionsCount));
          path.insertAfter(stateInitilize());

          // importリストを初期化
          importNameList.length = 0;

          path.node.specifiers.forEach(function (n) {
            importNameList.push(n.imported.name);
            var buildAst = mutationTypesBuilder({
              ACTION_NAME: t.identifier(n.imported.name),
              ACTION_STR: t.StringLiteral(n.imported.name)
            });

            // mutationTypes.js用のコードを追加していく
            mutationTypesCode.push((0, _babelGenerator2.default)(buildAst).code);
          });

          // "mutation-types.js"に書き込み
          (0, _fs.writeFileSync)(filepath, mutationTypesCode.join("\n"));

          // 書き込み先のファイル名("test/index.spec.js")
          var specPath = (0, _path.join)(__dirname, storeSpecDir, "index.spec.js");

          // テスト生成
          (0, _fs.writeFileSync)(specPath, specInitilize(path.node.specifiers).join('\n'));
        }
      },

      // 書き出したactions, mutationsの内容を、定義したactionに書き換えていく
      VariableDeclaration: function VariableDeclaration(path) {
        path.node.declarations.forEach(function (n1) {
          if (n1.id.name === 'actions') {
            path.node.declarations.forEach(function (d) {
              d.init.properties.forEach(function (n, i) {
                d.init.properties[i].key.name = importNameList[i];
                d.init.properties[i].body.body[0].expression.arguments[0].name = importNameList[i];
              });
            });
          }
          if (n1.id.name === 'mutations') {
            path.node.declarations.forEach(function (d) {
              d.init.properties.forEach(function (n, i) {
                d.init.properties[i].key.name = importNameList[i];
              });
            });
          }
        });
      }
    }
  };
};
