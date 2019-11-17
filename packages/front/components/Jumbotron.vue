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
          <v-btn color="accent" @click="start">
            START
          </v-btn>
        </v-row>
      </v-container>
    </v-overlay>
    
    <StartDialog ref="startDialog"/>
  </v-parallax>

</template>



<script>
  import image from "~/assets/.jumbotron.jpg";
  import StartDialog from "./StartDialog";

  export default {
    components: {
      StartDialog
    },


    computed: {
      img() {
        return image;
      }
    },

    methods: {
      start: async function() {
        await this.$refs.startDialog.open();

      }
    }


  };
</script>
