<template>
  <v-list>
    <v-list-item @click="">
      <v-list-item-action>
        <v-icon>mdi-home</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Home</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-list-item v-if="isSignedIn" @click="signout">
      <v-list-item-action>
        <v-icon>mdi-logout</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Sign out</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-list-item v-else @click="signin" v-bind:disabled="inProgress">
      <v-list-item-action>
        <v-icon>mdi-login</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Sign in</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>



<script>
  import authConfig from '../.auth.config.json';

  /* global gapi */

  export default {

    data() {
      return {
        isSignedIn: null,
        inProgress: null,
        auth2: null
      };
    },

    methods: {
      signin: function() {
        // console.log(this.$repositoryFactory.get('agent'));
        this.inProgress = true;

        gapi.load('auth2', () => {
          if (!this.auth2) {
            this.auth2 = gapi.auth2.init({
              client_id: authConfig.google.client_id,
              scope: 'openid',
            });
          }
          this.auth2.signIn()
            .then(() => {
              const token = this.auth2.currentUser.get().getAuthResponse()['id_token'];
              return this.$repositoryFactory.get('agent').signin(token);
            })

            .then((res) => {
              // 新規ユーザ -> signup
              if (res.status && res.status === 204) {

              }
              // 既存ユーザ -> スプシconsent or job作成待ち
              else if (res.status && res.status === 200) {

              }
              // signin失敗
              else {
                throw new Error(res.statusText || 'signin error');
              }

              console.log('res:', res);

              this.isSignedIn = this.auth2.isSignedIn.get();
              this.inProgress = false;
              console.info('signed in.');
            })

            // signin失敗, 成功+新規ユーザ, 成功+既存ユーザ+シートidなし, 成功+既存ユーザ+シートidあり
            .catch((err) => {
              this.auth2.signOut();
              this.inProgress = false;
              console.error(err);
            });
        });
      },

      signout: function() {
        this.auth2.signOut()
          .then(() => {
            this.isSignedIn = this.auth2.isSignedIn.get();
            console.info('signed out.');
          })
          .catch((err) => {
            console.error(err);
          });
      }
    },


    head: {
      script: [{
        src: 'https://apis.google.com/js/platform.js',
        async: true,
        defer: true
      }],
    }

  };
</script>
