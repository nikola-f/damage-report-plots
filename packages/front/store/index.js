export const state = () => ({
  isSignedIn: null,
  isWaiting: null,
  agent: null,
  centerLatitude: 0,
  centerLongitude: 0,
  zoom: 2
});



export const mutations = {

  mapMoved(state, latitude, longitude) {
    state.centerLatitude = latitude;
    state.centerLongitude = longitude;
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
