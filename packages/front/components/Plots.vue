<template>
  <v-container fluid class="ma-0 pa-0" style="height: 100%;" id="plots-ryqyh7ci1hf96eeb">
    <l-map style="height: 100%; margin: 0;" 
      zoom="2" minZoom="2"
    >

      <!--preferCanvas="true"-->

      <l-tile-layer :url="url" :attribution="attribution"
        zIndex="0"
      />
    </l-map>
    
  </v-container>
</template>

<script>
  import L from 'leaflet';

  export default {
    name: "plots-ryqyh7ci1hf96eeb",

    computed: {
      url() {
        return "http://{s}.tile.osm.org/{z}/{x}/{y}.png";
      },
      attribution() {
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      }
    },

  };
</script>
