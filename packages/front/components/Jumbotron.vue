<template>

  <v-parallax :src="img" style="height: 100%;">
    <v-overlay opacity="0.6" absolute>
      <v-container fluid>
        <v-row justify="center">
          <h2 class="my-4">
            Damage Report Plots
            <span class="subtitle-1">&beta;0</span>
          </h2>
        </v-row>
        <v-row justify="center">
          <v-btn color="accent">
            START
          </v-btn>
        </v-row>
      </v-container>
    </v-overlay>
  </v-parallax>

</template>



<script>
  import image from "~/assets/.jumbotron.jpg";

  export default {
    computed: {
      img() {
        return image;
      }
    }
  };
</script>
