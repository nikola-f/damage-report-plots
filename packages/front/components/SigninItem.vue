<template>

  <v-list-item v-if="!isSignedIn" @click="signin" :disabled="inProgress">

    <v-list-item-action>
      <v-icon>mdi-login</v-icon>
    </v-list-item-action>
    <v-list-item-content>
      <v-list-item-title>Sign in</v-list-item-title>
    </v-list-item-content>
    
    <SignupDialog ref="signupDialog" />

  </v-list-item>

</template>



<script>
  import authConfig from '../.auth.config.json';
  import Vue from 'vue';
  import SignupDialog from './SignupDialog';
  /* global gapi */

  export default {

    computed: {
      isSignedIn() {
        return this.$store.state.isSignedIn;
      },
      inProgress() {
        return this.$store.state.isWaiting;
      },
    },


    components: {
      SignupDialog
    },

    methods: {
      signup: async function(idToken) {

        try {
          const confirmed = await this.$refs.signupDialog.open();
          if (confirmed) {
            console.log('try to signup');
            const res = await this.$repositoryFactory.get('agent').signup(idToken);
            console.log(res);
            if (res && res.status === 200) {
              const agent = res.data;
              agent['idToken'] = idToken;
              this.$store.commit('signin', agent);
              console.info('signed up.');
            }
          }
          else {
            console.log('signup cancelled.');
          }
        }
        catch (err) {
          this.$auth2.signOut();
          this.$store.commit('signout');
          this.$store.commit('endWaiting');
          console.error(err);
        }
      },


      signin: async function() {
        this.$store.commit('startWaiting');
        this.$store.commit('hideDrawer');

        // let idToken;

        gapi.load('auth2', async() => {
          if (!this.$auth2) {
            Vue.prototype.$auth2 = gapi.auth2.init({
              client_id: authConfig.google.client_id,
              scope: 'openid',
            });
          }

          try {
            await this.$auth2.signIn();
            const idToken = this.$auth2.currentUser.get().getAuthResponse()['id_token'];
            const res = await this.$repositoryFactory.get('agent').signin(idToken);
            console.log('res:', res);

            // signin失敗
            if (!res.status || res.status > 204) {
              throw new Error(res.statusText || 'signin error');
            }

            // 新規ユーザ -> signup
            if (res.status === 204) {
              await this.signup(idToken);
            }

            // 既存ユーザ -> スプシconsent or job作成待ち
            else if (res.status === 200) {
              const agent = res.data;
              agent['idToken'] = idToken;
              this.$store.commit('signin', agent);
              console.info('signed in.');
            }

            if (!this.$auth2.isSignedIn.get()) {
              this.$store.commit('signout');
            }

            this.$store.commit('endWaiting');

          }
          catch (err) {
            this.$auth2.signOut();
            this.$store.commit('signout');
            this.$store.commit('endWaiting');
            console.error(err);
          }
        });
      },
    },
  };
</script>
