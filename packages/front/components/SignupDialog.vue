<template>
  <v-dialog
    v-model="dialog" scrollable persistent 
    max-width="80%" max-height="80%" @keydown.esc="cancel"
  >

    <v-card color="grey darken-3" style="opacity: 0.92;">
      <v-toolbar color="primary" dense>
        <v-toolbar-title>
          <v-icon class="mx-2">
            mdi-account-plus
          </v-icon>
          Sign up
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="my-4" style="height: 300px;">
        <TermsContent />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-checkbox
          v-model="consent"
          label="I accept the Terms of Service."
          class="mx-4"
          required
        />
        <v-btn color="primary" @click="cancel">CANCEL</v-btn>
        <v-btn color="accent" @click="signup" :disabled="!consent">SIGN UP</v-btn>
      </v-card-actions>
    </v-card>

  </v-dialog>
</template>

<script>
  import TermsContent from './TermsContent';
  export default {
    data() {
      return {
        dialog: false,
        consent: false,
        resolve: null,
        reject: null,
      };
    },

    components: {
      TermsContent
    },

    methods: {
      open() {
        this.dialog = true;
        return new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        });
      },

      signup() {
        this.resolve(true);
        this.dialog = false;
      },

      cancel() {
        this.resolve(false);
        this.dialog = false;
      },
    }


  };
</script>
