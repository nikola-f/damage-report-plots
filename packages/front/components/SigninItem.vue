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
      signup: function() {

      },


      signin: function() {
        // console.log(this.$repositoryFactory.get('agent'));
        // this.$store.state.isWaiting = true;
        this.$store.commit('startWaiting');
        this.$store.commit('hideDrawer');

        let idToken;

        gapi.load('auth2', () => {
          if (!this.$auth2) {
            Vue.prototype.$auth2 = gapi.auth2.init({
              client_id: authConfig.google.client_id,
              scope: 'openid',
            });
          }
          this.$auth2.signIn()
            .then(() => {
              idToken = this.$auth2.currentUser.get().getAuthResponse()['id_token'];
              return this.$repositoryFactory.get('agent').signin(idToken);
            })

            .then((res) => {
              console.log('res:', res);

              // signin失敗
              if (!res.status || res.status > 204) {
                throw new Error(res.statusText || 'signin error');
              }


              // 新規ユーザ -> signup
              if (res.status === 204) {
                this.$refs.signupDialog.open()
                  .then((confirmed) => {
                    if (confirmed) {
                      console.log('try to signup');

                    }
                    else {
                      console.info('signup cancelled.');
                    }
                  });
              }

              // 既存ユーザ -> スプシconsent or job作成待ち
              else if (res.status === 200) {
                const agent = res.data;
                agent['idToken'] = idToken;
                this.$store.commit('signin', agent);
              }



              if (!this.$auth2.isSignedIn.get()) {
                this.$store.commit('signout');
              }

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
