<template>
  <v-list>
    <v-list-item v-if="isSignedIn">
      <v-list-item-avatar>
        <v-img :src="agent.picture"></v-img>
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title v-html="agent.name"></v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list-item @click="home">
      <v-list-item-action>
        <v-icon>mdi-home</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Home</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <SigninItem />

    <v-list-item v-if="isSignedIn" @click="signout">
      <v-list-item-action>
        <v-icon>mdi-logout</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Sign out</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

  </v-list>
</template>



<script>
  import SigninItem from './SigninItem';

  export default {

    computed: {
      isSignedIn() {
        return this.$store.state.isSignedIn;
      },
      agent() {
        return this.$store.state.agent;
      }
    },

    components: {
      SigninItem
    },

    methods: {
      signout: function() {
        this.$store.commit('startWaiting');
        this.$store.commit('hideDrawer');
        this.$auth2.signOut()
          .then(() => {
            this.$store.commit('signout');
            console.info('signed out.');
            this.$store.commit('endWaiting');
          })
          .catch((err) => {
            console.error(err);
          });
      },

      home: function() {
        this.$router.push('/');
        this.$store.commit('hideDrawer');

      }
    },


  };
</script>
