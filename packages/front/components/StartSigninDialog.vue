<template>
  <v-dialog
    v-model="dialog"
    max-width="80%" max-height="90%" @keydown.esc="cancel"
  >

    <v-card color="grey darken-3" style="opacity: 0.92;">
      <v-toolbar color="primary" dense>
        <v-toolbar-title>
          <v-icon class="mx-2">
            mdi-run
          </v-icon>
          Start
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="my-4" style="height: 300px;">
        <h2>Lorem</h2>
        <p>Lorem</p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="cancel">CANCEL</v-btn>
        <v-btn color="accent" @click="signin">SIGN IN</v-btn>
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
