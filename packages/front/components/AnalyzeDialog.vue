<template>
  <v-dialog
    v-model="dialog" persistent 
    max-width="80%" max-height="80%" @keydown.esc="cancel"
  >

    <v-card color="grey darken-3" style="opacity: 0.92;">
      <v-toolbar color="primary" dense>
        <v-toolbar-title>
          <v-icon class="mx-2">
            mdi-email-search
          </v-icon>
          Plot portals
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="my-4" style="height: 300px;">
        <h2>Lorem</h2>
        <p>Ipsum</p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="cancel">CANCEL</v-btn>
        <v-btn color="accent" @click="goNext">GO NEXT; PLOT PORTALS</v-btn>
      </v-card-actions>
    </v-card>

  </v-dialog>
</template>

<script>
  export default {
    data() {
      return {
        dialog: false,
        consent: false,
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

      goNext() {
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
