<template>
  <v-app dark id="font-ek6sblj72q373bb1">

    <v-navigation-drawer app temporary />
      
    <!--</v-navigation-drawer>-->

      <!--
      v-model="drawer"
      color="primary"
      right
      width="auto"
      temporary
      <MenuList />
      -->


    <v-app-bar
      app
      dense
      flat
      color="primary"
      v-if="!isSignedIn"
    >

      <v-spacer />

      <v-menu left bottom>
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>

        <MenuList />
      </v-menu>
    </v-app-bar>

    <v-menu left top v-if="isSignedIn">
      <template v-slot:activator="{on}">
        <v-btn fab top right fixed color="accent" v-on="on" id='fab-Sg6FI4C3sj243pOC'>
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </template>

      <MenuList />
    </v-menu>

    <v-overlay v-model="overlay">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>


    <v-main>
      <v-container fluid style="height: 100%;" class="ma-0 pa-0">
        <nuxt />
      </v-container>
    </v-main>

    <SigninLogic ref="signinLogic" />
    <PlotLogic ref="plotLogic" />
    <!--<StartJobDialog ref="startJobDialog" />-->

    <v-footer app absolute color="primary" v-if="!isSignedIn">
      <div class="flex-grow-1 text-center">
        <!--<span class="mx-1">&copy; 2019</span>-->
        <nuxt-link to="/privacy-policy" class="mx-2 grey--text text--lighten-2">Privacy Policy</nuxt-link>
        <nuxt-link to="/terms" class="mx-2 grey--text text--lighten-2">Terms</nuxt-link>
      </div>
    </v-footer>

    <queued-snackbar />    

  </v-app>
</template>

<style>
  #font-ek6sblj72q373bb1 {
    font-family: 'Exo', sans-serif;
  }

  #fab-Sg6FI4C3sj243pOC {
    opacity: 0.9;
  }
</style>

<script>
  import MenuList from '../components/MenuList';
  import SigninLogic from '../components/SigninLogic';
  import PlotLogic from '../components/PlotLogic';
  import QueuedSnackbar from '../components/QueuedSnackbar';
  // import StartJobDialog from '../components/StartJobDialog';
  


  export default {

    data() {
      return {
        overlay: null,
      };
    },

    computed: {
      isSignedIn() {
        return this.$store.state.isSignedIn;
      },
      message() {
        return this.$store.state.message;
      }
    },

    components: {
      MenuList,
      SigninLogic,
      PlotLogic,
      // StartJobDialog,
      'queued-snackbar': QueuedSnackbar
    },


    mounted() {

      setTimeout(async() => {
        // init vuex
        this.$store.subscribe(async (mutation, state) => {
          switch (mutation.type) {
            case 'startWaiting':
              this.overlay = true;
              setTimeout(() => {
                this.overlay = false;
              }, 300000);
              break;

            case 'endWaiting':
              this.overlay = false;
              break;
              
            // case 'showStartJobDialog':
            //   if (await this.$refs.startJobDialog.open()) {
            //     console.log('go!');
            //   }           
            //   break;
          }

        });
        this.$store.commit('initialize');

        // reload agent what if signed in
        // console.log('isSignedIn@default.vue', this.$store.state.isSignedIn);
        if (this.$store.state.isSignedIn) {
          // const user = this.$auth2.currentUser.get();
          const agent = await this.$refs.signinLogic.getAgent();
          if (agent) {
            console.log('user re-signed in.');
            this.$store.commit('signin', agent);
            this.$store.commit('showMessage', `welcome back, agent ${agent.name}`);
          }
          else {
            console.log('user signed in google, but no drp session detected.');
            this.$auth2.signOut();
            this.$store.commit('signout');
          }

        }
      }, 0);


    }

  };
</script>
