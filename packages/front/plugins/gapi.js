import loadjs from 'loadjs';
import authConfig from '../.auth.config.json';
import Vue from 'vue';

/* global gapi */


loadjs('https://apis.google.com/js/api.js', { returnPromise: true })
  .then(async() => {
    const load = new Promise((resolve, reject) => {
      gapi.load('client:auth2', resolve);
    });

    return load.then(async() => {
      return await gapi.client.init({
          client_id: authConfig.google.client_id,
          scope: 'openid',
          discoveryDocs: [
            'https://sheets.googleapis.com/$discovery/rest?version=v4'
          ]
        })
        .then(() => {
          Vue.prototype.$auth2 = gapi.auth2.getAuthInstance();
          Vue.prototype.$gapi = {
            "client": gapi.client
          };
          console.log('gapi initialized:', gapi.client);
        });

    });

  });
