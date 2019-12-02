export const state = () => ({
  isSignedIn: null,
  isWaiting: null,
  agent: null,
  center: null,
  zoom: 2
});



export const mutations = {

  mapMoved(state, center) {
    state.center = center;
  },

  mapZoomed(state, zoom) {
    state.zoom = zoom;
  },

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
