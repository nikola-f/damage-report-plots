<template>
  <v-container fluid
    class="ma-0 pa-0"
    style="height: 100%; z-index: 1;"
    id="plots-ryqyh7ci1hf96eeb"
  >
    <AnalyzeDialog ref="analyzeDialog" />
    <JobLogic ref="jobLogic" />
  </v-container>
</template>

<script>
  import L from 'leaflet';
  import 'leaflet.tilelayer.colorfilter/src/leaflet-tilelayer-colorfilter.js';
  import AnalyzeDialog from './AnalyzeDialog';
  import JobLogic from './JobLogic';

  export default {

    components: {
      AnalyzeDialog,
      JobLogic
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
      const inverseFilter = [
        'hue:180deg',
        'invert:100%',
        'saturate:40%'
      ];
      this.map = L.map('plots-ryqyh7ci1hf96eeb', {
          "center": center,
          "zoom": zoom,
          "minZoom": 3,
          "maxBounds": [
            [-90, -18000],
            [90, 18000]
          ]
        })
        .addLayer(L.tileLayer.colorFilter('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          "attribution": '&copy; ' +
            '<a href="https://www.openstreetmap.org/copyright">' +
            'OpenStreetMap</a> contributors',
          "filter": inverseFilter
        }))
        .on('zoomend', this.zoomend)
        .on('moveend', this.moveend)
        .addControl(L.control.scale());

      // plot all
      if (this.$store.state.agent && this.$store.state.agent.spreadsheetId) {
        // add auth

      }
      // start job
      else if (await this.$refs.analyzeDialog.open()) {
        this.$refs.jobLogic.create();

      }
      // nop
      else {
        console.log('no go');
      }

    }

  };
</script>
