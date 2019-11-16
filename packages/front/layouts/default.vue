<template>
  <v-app dark id="fontSetting">

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
      <v-container fluid style="height: 100%;">
        <nuxt />
      </v-container>
    </v-content>

    <v-footer
      app
      absolute
      color="primary"
    >
      <div class="flex-grow-1 text-center">
        <!--<span class="mx-1">&copy; 2019</span>-->
        <a class="mx-2 grey--text text--lighten-2">Privacy Policy</a>
        <a class="mx-2 grey--text text--lighten-2">Terms</a>
      </div>
    </v-footer>
      
  </v-app>
</template>

<style>
  #fontSetting {
    font-family: 'Exo', sans-serif;
  }
</style>

<script>
  import MenuList from '../components/MenuList';


  export default {

    data() {
      return {
        drawer: null,
        overlay: null
      };
    },


    components: {
      MenuList,
    },

    methods: {
      toggleDrawer: function() {
        this.$store.commit('toggleDrawer');
      }
    },


    mounted() {

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
    }

  };
</script>
