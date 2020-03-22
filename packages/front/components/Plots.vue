<template>
  <v-container fluid
    class="ma-0 pa-0"
    style="height: 100%; z-index: 1;"
    id="plots-ryqyh7ci1hf96eeb"
  >
    <AnalyzeDialog ref="analyzeDialog" />
    <JobLogic ref="jobLogic" />
    <DonutCluster ref="donutCluster" />
  </v-container>
</template>

<script>
  import L from 'leaflet';
  import 'leaflet.tilelayer.colorfilter/src/leaflet-tilelayer-colorfilter.js';
  // import 'leaflet.markercluster';
  // import '../plugins/leaflet/Leaflet.DonutCluster';
  // import '../plugins/leaflet/Leaflet.DonutCluster.css';
  import AnalyzeDialog from './AnalyzeDialog';
  import JobLogic from './JobLogic';
  import DonutCluster from './DonutCluster';

  // const TIME_RECENT = Date.now() - 24 * 3600 * 1000 * 150;
  // const TIME_FORMER = Date.now() - 24 * 3600 * 1000 * 360;
  const COLOR_C = "#49ebc3";
  const COLOR_R = "#b68bff";
  const COLOR_VR = "#f781ff";


  export default {

    components: {
      AnalyzeDialog,
      JobLogic,
      DonutCluster
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
        map: null,
        clusters: null,
        unsubscribe: null
      };
    },

    beforeDestroy() {
      this.unsubscribe();
    },

    mounted() {

      const center = this.$store.state.center || { "lat": 0, "lng": 0 };
      const zoom = this.$store.state.zoom || 3;
      const inverseFilter = [
        'hue:180deg',
        'invert:100%',
        'saturate:40%'
      ];
      this.clusters = this.$refs.donutCluster.getCluster();

      this.map = L.map('plots-ryqyh7ci1hf96eeb', {
          "center": center,
          "zoom": zoom,
          "minZoom": 3,
          "maxBounds": [
            [-90, -190],
            [90, 190]
          ],
          "preferCanvas": true
        })
        .addLayer(L.tileLayer.colorFilter('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
          "attribution": '&copy; ' +
            '<a href="https://www.openstreetmap.org/copyright">' +
            'OpenStreetMap</a> contributors',
          "filter": inverseFilter
        }))
        .on('zoomend', this.zoomend)
        .on('moveend', this.moveend)
        .addControl(L.control.scale())
        .addLayer(this.clusters);

      this.unsubscribe = this.$store.subscribe((mutation, state) => {
        if (mutation.type !== 'plotsLoaded') {
          return;
        }

        // console.log('try to plot');
        // console.log('stats@Plots.vue:', this.$store.state.stats);

        const markers = [];
        for (const plot of this.$store.state.plots) {

          let color = "";
          switch (plot[6]) {
            case "C":
              color = COLOR_C;
              break;
            case "R":
              color = COLOR_R;
              break;
            case "VR":
              color = COLOR_VR;
              break;
          }

          let dashArray = null;
          let dashOffset = null;
          if (plot[3] >= this.$store.state.stats.mostReportedCount) { // top 0.5% most reported
            dashArray = "16,5";
            // dashOffset = "13.5";
          }

          const marker = L.circleMarker([plot[0], plot[1]], {
            "color": color,
            "fillOpacity": plot[2] ? 0.8 : 0.2,
            "dashArray": dashArray,
            // "dashOffset": dashOffset,
            "elapsed": plot[6]
          });
          marker.bindPopup(plot[5]);
          markers.push(marker);
          // this.clusters.addLayer(marker);
        }

        L.layerGroup(markers).addTo(this.clusters);

      });

    }

  };
</script>
