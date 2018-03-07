import { ADD, DONE, DELETE } from "./mutation-types";
const state = {};
const actions = {
  [ADD]({ commit }, state) {
    commit(ADD, state);
  },

  [DONE]({ commit }, state) {
    commit(DONE, state);
  },

  [DELETE]({ commit }, state) {
    commit(DELETE, state);
  }
};
const mutations = {
  [ADD](state) {
    state = state;
  },

  [DONE](state) {
    state = state;
  },

  [DELETE](state) {
    state = state;
  }
};
const getters = {};
export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
});
