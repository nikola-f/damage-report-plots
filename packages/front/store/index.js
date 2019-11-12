export const state = () => ({
  isSignedIn: null,
  isWaiting: null,
  agent: null,
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

  toggleDrawer(state) {},

  hideDrawer(state) {}


};
