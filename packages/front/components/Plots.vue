<template>
  <v-container fluid fill-height
    class="ma-0 pa-0"
      style="z-index: 0"
      id="plots-ryqyh7ci1hf96eeb"
  >

    <!--<AnalyzeDialog ref="analyzeDialog" />-->
    <JobLogic ref="jobLogic" />
    <DonutClusterGroup ref="donutClusterGroup" />
    <NavBarControl ref="navBarControl" />

  </v-container>
</template>

<style>
  .leaflet-popup-content {
    color: white !important;
    font-weight: normal;
    font-family: 'Exo', sans-serif;
  }

  .leaflet-popup-content-wrapper {
    background: #3b1e5f;
    border-style: none;
    opacity: 0.9;
  }
</style>
<script>
  import L from 'leaflet';
  import 'leaflet.tilelayer.colorfilter/src/leaflet-tilelayer-colorfilter.js';
  // import AnalyzeDialog from './AnalyzeDialog';
  import JobLogic from './JobLogic';
  import DonutClusterGroup from './DonutClusterGroup';
  import NavBarControl from './NavBarControl';

  const COLOR_C = "#49ebc3";
  const COLOR_R = "#b68bff";
  const COLOR_VR = "#f781ff";


  export default {

    components: {
      // AnalyzeDialog,
      JobLogic,
      DonutClusterGroup,
      NavBarControl
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
        clusterGroup: null,
        unsubscribe: null
      };
    },

    beforeDestroy() {
      this.map.remove();
      this.clusterGroup.remove();
      this.$store.commit('plotsRemoved');
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
      this.clusterGroup = this.$refs.donutClusterGroup.getInstance();

      this.map = L.map('plots-ryqyh7ci1hf96eeb', {
          "center": center,
          "zoom": zoom,
          "minZoom": 3,
          "maxBounds": [
            [-90, -190],
            [90, 190]
          ],
          "attributionControl": false,
          "zoomControl": false
          // "preferCanvas": true
        })
        .addLayer(L.tileLayer.colorFilter('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          "filter": inverseFilter,
        }))
        .on('zoomend', this.zoomend)
        .on('moveend', this.moveend)
        .addControl(L.control.attribution({
          "position": 'bottomleft',
          "prefix": '&copy; ' +
            '<a href="https://www.openstreetmap.org/copyright">' +
            'OpenStreetMap</a> contributors'
        }))
        .addControl(L.control.scale({
          "position": 'bottomleft'
        }))

        .addLayer(this.clusterGroup);
        
        // console.log('navBarControl:', this.$refs.navBarControl.getInstance());
        this.$refs.navBarControl.getInstance().addTo(this.map);
        L.control.zoom({
          "position": 'bottomright'
        }).addTo(this.map);

      this.unsubscribe = this.$store.subscribe((mutation, state) => {
        if (mutation.type !== 'plotsLoaded') {
          return;
        }

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
          // let dashOffset = null;
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
        }

        L.layerGroup(markers).addTo(this.clusterGroup);

      });

    }

  };
</script>
