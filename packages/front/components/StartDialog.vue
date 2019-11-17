<template>
  <v-dialog
    v-model="dialog"
    max-width="80%" max-height="80%" @keydown.esc="cancel"
  >

    <v-card color="grey darken-3">
      <v-toolbar color="primary">
        <v-toolbar-title>
          <v-icon class="mx-2">
            mdi-information
          </v-icon>
          Start
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text style="height: 300px;">
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="cancel">CANCEL</v-btn>
        <v-btn color="accent" @click="signin">GO NEXT, SIGN IN</v-btn>
      </v-card-actions>
    </v-card>
    
    <SigninLogic ref="signinLogic" />

  </v-dialog>
</template>

<script>
  import SigninLogic from './SigninLogic';

  export default {

    components: {
      SigninLogic
    },

    data() {
      return {
        dialog: false,
        resolve: null,
        reject: null,
      };
    },

    methods: {
      open() {
        this.dialog = true;
        return new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        });
      },

      signin() {
        this.resolve(true);
        this.dialog = false;
        this.$refs.signinLogic.signin();
      },

      cancel() {
        this.resolve(false);
        this.dialog = false;
      },
    }


  };
</script>
