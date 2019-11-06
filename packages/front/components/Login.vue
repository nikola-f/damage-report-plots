<template>
  <v-list-item v-if="!isSignedIn" @click="signin" v-bind:disabled="inProgress">
    <v-list-item-action>
      <v-icon>mdi-login</v-icon>
    </v-list-item-action>
    <v-list-item-content>
      <v-list-item-title>Sign in</v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>



<script>
  import authConfig from '../.auth.config.json';
  import Vue from 'vue';
  /* global gapi */

  export default {

    computed: {
      isSignedIn() {
        return this.$store.state.isSignedIn;
      },
      inProgress() {
        return this.$store.state.isWaiting;
      }
    },

    methods: {
      signin: function() {
        // console.log(this.$repositoryFactory.get('agent'));
        // this.$store.state.isWaiting = true;
        this.$store.commit('startWaiting');
        this.$store.commit('hideDrawer');

        gapi.load('auth2', () => {
          if (!this.$auth2) {
            Vue.prototype.$auth2 = gapi.auth2.init({
              client_id: authConfig.google.client_id,
              scope: 'openid',
            });
          }
          this.$auth2.signIn()
            .then(() => {
              const token = this.$auth2.currentUser.get().getAuthResponse()['id_token'];
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

              // this.$isSignedIn = this.auth2.isSignedIn.get();
              this.$auth2.isSignedIn.get() ? this.$store.commit('signin') : this.$store.commit('signout');

              this.$store.commit('endWaiting');
              console.info('signed in.');
            })

            // signin失敗, 成功+新規ユーザ, 成功+既存ユーザ+シートidなし, 成功+既存ユーザ+シートidあり
            .catch((err) => {
              this.$auth2.signOut();
              this.$store.commit('signout');
              this.$store.commit('endWaiting');
              console.error(err);
            });
        });
      },

    },

  };
</script>
