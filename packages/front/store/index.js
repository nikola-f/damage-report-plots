import Vue from 'vue';

const INIT_STATS = {
  "mostReportedCount": 1000000,
  "capturedCount": 0,
  "lastReportTime": 0,
  "firstReportTime": 0
};

export const state = () => ({
  isSignedIn: false,
  isWaiting: false,
  agent: {},
  plots: [],
  stats: INIT_STATS,

  // persistent
  center: { "lat": 0, "lng": 0 },
  zoom: 2
});



export const mutations = {

  initialize(state) {
    // console.log('$auth2@initialize:', Vue.prototype.$auth2);
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

  signout(state) {
    state.isSignedIn = false;
  },

  startWaiting(state) {
    state.isWaiting = true;
  },

  endWaiting(state) {
    state.isWaiting = false;
  },

  plotsLoaded(state, payload) {
    state.plots = payload.plots;
    state.stats = payload.stats;
    console.log('stats@plotsLoaded', state.stats);
  },

  plotsRemoved(state) {
    state.plots = [];
    state.stats = INIT_STATS;
  },

  toggleDrawer(state) {},

  hideDrawer(state) {}


};
