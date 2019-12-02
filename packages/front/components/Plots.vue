<template>
  <v-container fluid
    class="ma-0 pa-0"
    style="height: 100%; z-index: 0;"
    id="plots-ryqyh7ci1hf96eeb"
  />
</template>

<script>
  import L from 'leaflet';

  export default {

    methods: {
      zoomend() {
        this.$store.commit('mapZoomed', this.map.getZoom());
      },

      moveend() {
        this.$store.commit('mapMoved', this.map.getCenter());
      }
    },

    data() {
      return {
        map: null
      };
    },

    mounted() {
      const center = this.$store.state.center || { "lat": 0, "lng": 0 };
      const zoom = this.$store.state.zoom || 3;
      this.map = L.map('plots-ryqyh7ci1hf96eeb', {
          "center": center,
          "zoom": zoom,
          "minZoom": 2
        })
        .addLayer(L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          "attribution": '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }))
        .on('zoomend', this.zoomend)
        .on('moveend', this.moveend);
    }

  };
</script>
