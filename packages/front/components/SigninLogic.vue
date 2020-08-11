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
        try {
          await this.$auth2.signOut();
          const res = await this.$repositoryFactory.get('agent').signout();
          console.log('res@signout:', res);
        }
        catch (err) {
          console.error(err);
        }
        this.$store.commit('signout');
        console.info('signed out.');
        this.$store.commit('showMessage', `you've signed out.`);
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
              // agent['idToken'] = idToken;
              // agent['expiresAt'] = user.getAuthResponse()['expires_at'];
              this.$store.commit('signin', agent);
              this.$store.commit('showMessage', `welcome, agent ${agent.name}`);
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


      getAgent: async function() {
        const authRes = this.$auth2.currentUser.get().getAuthResponse();
        const idToken = authRes['id_token'];
        // const res = await this.$repositoryFactory.get('agent').signin(idToken);

                
        try {
          const res = await this.$repositoryFactory.get('agent').getAgent();
  
          console.log('res@getAgent:', res);
          
          let agent = {};
          if (!res.status || res.status > 200) {
            console.info('no session@getAgent');
            return null;
            // throw new Error(res.statusText || 'signin error');
          }

          // else if (res.status === 200) {
          else {
            agent = res.data;
            agent['idToken'] = idToken;
            agent['expiresAt'] = authRes['expires_at'];
            return agent;
          }

        }catch(err){
          console.error(err);
          return null;
        }

      },


      signin: async function() {
        this.$store.commit('startWaiting');

        try {
          const user = await this.$auth2.signIn();
          const idToken = user.getAuthResponse()['id_token'];
          // const res = await this.getAgent(user);
          const res = await this.$repositoryFactory.get('agent').signin(idToken);
          console.log('res@agent.signin:', res);

          // new user -> signup
          if (res.status === 204) {
            await this.signup(user);
          }

          // saved user
          else if (res.status === 200) {
            const agent = res.data;
            this.$store.commit('signin', agent);
            this.$store.commit('showMessage', `welcome back, agent ${agent.name}`);
            console.info('signed in:', agent);
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
