<template>
  <SignupDialog ref="signupDialog" />
</template>

<script>
  import SignupDialog from './SignupDialog';


  export default {

    components: {
      SignupDialog,
    },

    methods: {

      signout: async function() {
        this.$store.commit('startWaiting');
        // this.$store.commit('hideDrawer');
        try {
          await this.$auth2.signOut();
        }
        catch (err) {
          console.error(err);
        }
        this.$store.commit('signout');
        console.info('signed out.');
        this.$store.commit('endWaiting');
      },

      signup: async function(user) {
        try {

          const confirmed = await this.$refs.signupDialog.open();
          if (confirmed) {
            console.log('try to signup');
            const idToken = user.getAuthResponse()['id_token'];
            const res = await this.$repositoryFactory.get('agent').signup(idToken);
            console.log(res);
            if (res && res.status === 200) {
              const agent = res.data;
              agent['idToken'] = idToken;
              agent['expiresAt'] = user.getAuthResponse()['expires_at'];
              this.$store.commit('signin', agent);
              console.info('signed up.');
            }
          }
          else {
            console.log('signup cancelled.');
            this.$auth2.signOut();
            this.$store.commit('signout');
          }
        }
        catch (err) {
          this.$auth2.signOut();
          this.$store.commit('signout');
          this.$store.commit('endWaiting');
          console.error(err);
        }
      },

      getAgent: async function(user) {
        const idToken = user.getAuthResponse()['id_token'];
        const res = await this.$repositoryFactory.get('agent').signin(idToken);

        console.log('res@getAgent:', res);

        let agent = {};
        if (!res.status || res.status > 204) {
          throw new Error(res.statusText || 'signin error');

        }
        else if (res.status === 200) {
          agent = res.data;
          agent['idToken'] = idToken;
          agent['expiresAt'] = this.$auth2.currentUser.get().getAuthResponse()['expires_at'];
        }
        return {
          "status": res.status,
          "agent": agent
        };
      },


      signin: async function() {
        this.$store.commit('startWaiting');
        // this.$store.commit('hideDrawer');

        try {
          const user = await this.$auth2.signIn();
          const res = await this.getAgent(user);
          console.log('res:', res);

          // new user -> signup
          if (res.status === 204) {
            await this.signup(user);
          }

          // saved user
          else if (res.status === 200) {
            this.$store.commit('signin', res.agent);
            console.info('signed in:', res.agent);
          }

          this.$store.commit('endWaiting');
        }
        catch (err) {
          this.$store.commit('endWaiting');
          console.error(err);
        }
      },
    }

  };
</script>
