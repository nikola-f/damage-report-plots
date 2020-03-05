import scriptjs from 'scriptjs';
import authConfig from '../.auth.config.json';
import Vue from 'vue';

/* global gapi */



scriptjs('https://apis.google.com/js/platform.js', function() {

  gapi.load('auth2', () => {
    console.log('gapi loaded');
    if (!Vue.prototype.$auth2) {
      Vue.prototype.$auth2 = gapi.auth2.init({
        client_id: authConfig.google.client_id,
        scope: 'openid',
      });

    }
  });

});
