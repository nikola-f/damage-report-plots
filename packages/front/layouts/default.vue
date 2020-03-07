<template>
  <v-app dark id="font-ek6sblj72q373bb1">

    <v-navigation-drawer
      app
      v-model="drawer"
      color="primary"
      right
      temporary
      width="auto"
    >

      <MenuList />

    </v-navigation-drawer>

    <v-app-bar
      app
      dense
      elevation="0"
      color="primary"
    >
      <div class="flex-grow-1"></div>
      <v-app-bar-nav-icon @click.stop="toggleDrawer"></v-app-bar-nav-icon>
    </v-app-bar>

    <v-overlay v-model="overlay">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
    

    <v-content>
      <v-container fluid style="height: 100%;" class="ma-0 pa-0">
        <nuxt />
      </v-container>
    </v-content>

    <SigninLogic ref="signinLogic" />

    <v-footer
      app
      absolute
      color="primary"
    >
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


  export default {

    data() {
      return {
        drawer: null,
        overlay: null
      };
    },


    components: {
      MenuList,
      SigninLogic
    },

    methods: {
      toggleDrawer: function() {
        this.$store.commit('toggleDrawer');
      }
    },


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

            case 'toggleDrawer':
              this.drawer = !this.drawer;
              break;

            case 'hideDrawer':
              this.drawer = false;
              break;
          }

        });
        this.$store.commit('initialize');

        // reload agent what if signed in
        console.log('isSignedIn@default.vue', this.$store.state.isSignedIn);
        if (this.$store.state.isSignedIn) {
          const user = this.$auth2.currentUser.get();
          const res = await this.$refs.signinLogic.getAgent(user);
          console.log('res@default.vue/getAgent:', res);
          if (res.status === 200) {
            console.log('user re-signed in.')
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
