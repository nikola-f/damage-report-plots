<template>
  <v-list>
    <v-list-item v-show="isSignedIn">
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

    <v-list-item v-show="isSignedIn" @click="signout" :disabled="inProgress">
      <v-list-item-action>
        <v-icon>mdi-logout</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Sign out</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list-item v-show="!isSignedIn" @click="signin" :disabled="inProgress">
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
        return this.$store.state.agent || {
          "name": '',
          "picture": ''
        };
      }
    },

    methods: {

      signout: async function() {
        this.$refs.signinLogic.signout();
      },

      signin: async function() {
        this.$refs.signinLogic.signin();
      },

      home: function() {
        this.$router.push('/');
        this.$store.commit('hideDrawer');

      }
    },

    // mounted() {
    //   console.log('mounted@MenuList', this.$store.state);
    // }
        

  };
</script>
