<template>
  <v-app dark id="font-ek6sblj72q373bb1">

    <v-navigation-drawer app />
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
        <v-btn fab top right fixed color="accent" v-on="on">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </template>

      <MenuList />
    </v-menu>

    <v-overlay v-model="overlay">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>


    <v-content>
      <v-container fluid style="height: 100%;" class="ma-0 pa-0">
        <nuxt />
      </v-container>
    </v-content>

    <SigninLogic ref="signinLogic" />
    <PlotLogic ref="plotLogic" />

    <v-footer app absolute padless color="primary" v-if="!isSignedIn">
      <div class="flex-grow-1 text-center">
        <!--<span class="mx-1">&copy; 2019</span>-->
        <nuxt-link to="/privacy-policy" class="mx-2 grey--text text--lighten-2">Privacy Policy</nuxt-link>
        <nuxt-link to="/terms" class="mx-2 grey--text text--lighten-2">Terms</nuxt-link>
      </div>
    </v-footer>

  </v-app>
</template>

<style>
  #font-ek6sblj72q373bb1 {
    font-family: 'Exo', sans-serif;
  }
</style>

<script>
  import MenuList from '../components/MenuList';
  import SigninLogic from '../components/SigninLogic';
  import PlotLogic from '../components/PlotLogic';


  export default {

    data() {
      return {
        // drawer: null,
        overlay: null
      };
    },

    computed: {
      isSignedIn() {
        return this.$store.state.isSignedIn;
      }
    },

    components: {
      MenuList,
      SigninLogic,
      PlotLogic
    },

    // methods: {
    //   toggleDrawer: function() {
    //     this.$store.commit('toggleDrawer');
    //   }
    // },


    mounted() {

      setTimeout(async() => {
        // init vuex
        this.$store.subscribe((mutation, state) => {
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

            // case 'toggleDrawer':
            //   this.drawer = !this.drawer;
            //   break;

            // case 'hideDrawer':
            //   this.drawer = false;
            //   break;
          }

        });
        this.$store.commit('initialize');

        // reload agent what if signed in
        // console.log('isSignedIn@default.vue', this.$store.state.isSignedIn);
        if (this.$store.state.isSignedIn) {
          const user = this.$auth2.currentUser.get();
          const res = await this.$refs.signinLogic.getAgent(user);
          // console.log('res@default.vue/getAgent:', res);
          if (res.status === 200) {
            console.log('user re-signed in.');
            this.$store.commit('signin', res.agent);
          }
          else {
            console.log('user signed in, but new user');
            this.$auth2.signOut();
            this.$store.commit('signout');
          }

        }
      }, 0);


    }

  };
</script>
