<template>
  <v-container fluid
    class="ma-0 pa-0"
    style="height: 100%; z-index: 1;"
    id="plots-ryqyh7ci1hf96eeb"
  >
    <AnalyzeDialog ref="analyzeDialog" />
  </v-container>
</template>

<script>
  import L from 'leaflet';
  import AnalyzeDialog from './AnalyzeDialog';

  export default {

    components: {
      AnalyzeDialog
    },

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

    async mounted() {
      const center = this.$store.state.center || { "lat": 0, "lng": 0 };
      const zoom = this.$store.state.zoom || 3;
      this.map = L.map('plots-ryqyh7ci1hf96eeb', {
          "center": center,
          "zoom": zoom,
          "minZoom": 2
        })
        .addLayer(L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          "attribution": '&copy; ' +
            '<a href="https://www.openstreetmap.org/copyright">' +
            'OpenStreetMap</a> contributors'
        }))
        .on('zoomend', this.zoomend)
        .on('moveend', this.moveend);

      if (this.$store.state.agent.spreadsheetId) {

      }
      else if (await this.$refs.analyzeDialog.open()) {
        console.log('go');
        const user = this.$auth2.currentUser.get();
        const res = await user.grant({
          "scope": 'https://www.googleapis.com/auth/spreadsheets' +
            ' ' +
            'https://www.googleapis.com/auth/gmail.readonly'
        });
        console.table(res);

      }
      else {
        console.log('no go');
      }

    }

  };
</script>
