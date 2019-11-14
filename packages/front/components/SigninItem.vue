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
  import SignupDialog from './SignupDialog';

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
      signup: async function(idToken, expiresAt) {

        try {
          const confirmed = await this.$refs.signupDialog.open();
          if (confirmed) {
            console.log('try to signup');
            const res = await this.$repositoryFactory.get('agent').signup(idToken);
            console.log(res);
            if (res && res.status === 200) {
              const agent = res.data;
              agent['idToken'] = idToken;
              agent['expiresAt'] = expiresAt;
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

        try {
          await this.$auth2.signIn();
          const idToken = this.$auth2.currentUser.get().getAuthResponse()['id_token'];
          const expiresAt = this.$auth2.currentUser.get().getAuthResponse()['expires_at'];
          const res = await this.$repositoryFactory.get('agent').signin(idToken);
          console.log('res:', res);

          // signin failed
          if (!res.status || res.status > 204) {
            throw new Error(res.statusText || 'signin error');
          }

          // new user -> signup
          if (res.status === 204) {
            await this.signup(idToken, expiresAt);
          }

          // saved user
          else if (res.status === 200) {
            const agent = res.data;
            agent['idToken'] = idToken;
            agent['expiresAt'] = expiresAt;
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
      },
    },
  };
</script>
