<template>
  <v-app dark>
    <v-navigation-drawer
      v-model="drawer"
      app
      right
      clipped
      color="primary"
      width="auto"
    >

      <Menu />

    </v-navigation-drawer>

    <v-app-bar
      app
      clipped-right
      color="primary"
    >
      <!--<v-toolbar-title>damage report plots</v-toolbar-title>-->
      <div class="flex-grow-1"></div>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    </v-app-bar>

    <v-content>
      <v-container>
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

<script>
  import Menu from '../components/Menu';

  export default {

    data() {
      return {
        drawer: null,
      };
    },

    components: {
      Menu
    }

  };
</script>
