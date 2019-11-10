<template>
  <v-dialog v-model="dialog" scrollable max-width="80%" max-height="80%">

    <v-card>
      <v-card-title>Signup</v-card-title>
      <v-divider></v-divider>
      <v-card-text style="height: 300px;">
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn color="primary" @click="dialog = false">Cancel</v-btn>
        <v-btn color="accent" @click="dialog = false">Signup</v-btn>
      </v-card-actions>
    </v-card>

  </v-dialog>
</template>

<script>
  export default {
    data() {
      return {
        dialog: true,
      };
    },
  };
</script>
