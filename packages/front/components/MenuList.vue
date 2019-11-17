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

    <v-list-item v-if="isSignedIn" @click="signout" :disabled="inProgress">
      <v-list-item-action>
        <v-icon>mdi-logout</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Sign out</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list-item v-else @click="signin" :disabled="inProgress">
      <v-list-item-action>
        <v-icon>mdi-login</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Sign in</v-list-item-title>
      </v-list-item-content>
      <SigninLogic ref="signinLogic" />
    </v-list-item>

  </v-list>
</template>



<script>
  // import SigninItem from './SigninItem';
  import SigninLogic from './SigninLogic';

  export default {

    components: {
      SigninLogic
    },

    computed: {
      isSignedIn() {
        return this.$store.state.isSignedIn;
      },
      inProgress() {
        return this.$store.state.isWaiting;
      },
      agent() {
        return this.$store.state.agent;
      }
    },

    methods: {
      signout: async function() {
        this.$store.commit('startWaiting');
        this.$store.commit('hideDrawer');
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

      signin: async function() {
        this.$refs.signinLogic.signin();
      },

      home: function() {
        this.$router.push('/');
        this.$store.commit('hideDrawer');

      }
    },


  };
</script>
