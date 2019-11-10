export const state = () => ({
  isSignedIn: null,
  isWaiting: null,
  agent: null,
  // drawer: null
  // auth2: null
});



export const mutations = {
  signin(state, agent) {
    state.isSignedIn = true;
    state.agent = agent;
  },

  signout(state) {
    state.isSignedIn = false;
    state.agent = null;
  },

  startWaiting(state) {
    state.isWaiting = true;
  },

  endWaiting(state) {
    state.isWaiting = false;
  },

  toggleDrawer(state) {
    // state.drawer = !state.drawer;
  },

  hideDrawer(state) {
    // state.drawer = false;
  }


};
