import Vue from 'vue';

export const state = () => ({
  isSignedIn: false,
  isWaiting: false,
  agent: {},
  center: { "lat": 0, "lng": 0 },
  zoom: 2
});



export const mutations = {

  initialize(state) {
    if (Vue.prototype.$auth2) {
      state.isSignedIn = Vue.prototype.$auth2.isSignedIn.get();
    }
    else {
      state.isSignedIn = false;
    }
  },


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

  // resignin(state, agent) {
  //   state.isSignedIn = true;
  //   state.agent = agent;
  // },
  
  signout(state) {
    state.isSignedIn = false;
    // state.agent = {};
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
