import scriptjs from 'scriptjs';
import authConfig from '../.auth.config.json';
import Vue from 'vue';

/* global gapi */



scriptjs('https://apis.google.com/js/api.js', () => {

  gapi.load('client:auth2', () => {
    console.log('gapi loaded');
    gapi.client.init({
        client_id: authConfig.google.client_id,
        scope: 'openid',
        discoveryDocs: [
          'https://sheets.googleapis.com/$discovery/rest?version=v4'
        ]
      })
      .then(() => {
        // console.log('gapi.client:', gapi.client);
        Vue.prototype.$auth2 = gapi.auth2.getAuthInstance();
        Vue.prototype.$gapi = {
          "client": gapi.client
        };
      });

  });

});
