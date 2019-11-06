export const state = () => ({
  isSignedIn: null,
  isWaiting: null,
  // drawer: null
  // auth2: null
});



export const mutations = {
  signin(state) {
    state.isSignedIn = true;
  },

  signout(state) {
    state.isSignedIn = false;
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
