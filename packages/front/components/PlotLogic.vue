<template>
</template>

<script>
  const SCOPE_READ_PLOTS = 'https://www.googleapis.com/auth/spreadsheets.readonly';
  const TIME_RECENT = Date.now() - 24 * 3600 * 1000 * 150;
  const TIME_FORMER = Date.now() - 24 * 3600 * 1000 * 360;


  export default {

    data() {
      return {
        unsubscribe: null
      };
    },

    beforeDestroy() {
      this.unsubscribe();
    },

    mounted() {
      // after signin
      this.unsubscribe = this.$store.subscribe(async(mutation, state) => {
        if (mutation.type !== 'signin') {
          return;
        }

        // plot
        if (state.agent && state.agent.spreadsheetId &&
          await this.grant(this)) {
          this.getPlots(this);
        }

        // start job w/ dialog
        else if (await this.$refs.analyzeDialog.open()) {
          this.$refs.jobLogic.create();
        }

        else {
          console.log('no go');

        }

      });
    },

    methods: {
      grant: async(vue) => {
        const user = vue.$auth2.currentUser.get();
        let result = false;
        if (user.hasGrantedScopes(SCOPE_READ_PLOTS)) {
          result = true;
          // console.log('already has grant');
        }
        else {
          const res = await user.grant({
            "scope": SCOPE_READ_PLOTS
          });
          result = res ? true : false;
        }
        return result;
      },

      getPlots: async(vue) => {
        // console.info('try to get plots data from spreadsheets:', vue.$store.state.agent.spreadsheetId);
        // vue.$store.commit('showMessage', 'try to load plots data from spreadsheets...');

        const res = await vue.$gapi.client.sheets.spreadsheets.values.get({
          "spreadsheetId": vue.$store.state.agent.spreadsheetId,
          "range": 'aggregated!A:E',
        });
        // console.log(res);

        if (res.result && res.result.values) {
          const values = res.result.values;
          const plots = [];
          const reportedCountArray = [];
          let upc = 0;
          for (let i = 1; i < values.length; i++) { // skip 1st row
            const lastReported = Number(
              values[i][4].slice(0, values[i][4].indexOf(','))
            ); // last reported at

            let elapsed;
            if (lastReported < TIME_FORMER) {
              elapsed = "C";
            }
            else if (lastReported >= TIME_RECENT) {
              elapsed = "VR";
            }
            else {
              elapsed = "R";
            }

            plots.push([
              Number(values[i][0]), // lat
              Number(values[i][1]), // long
              values[i][2] === "1" ? true : false, // upc
              Number(values[i][3]), // reported count
              lastReported,
              values[i][4]
              .slice(values[i][4].indexOf(',') + 1), // portal name
              elapsed
            ]);

            if (values[i][2] === "1") {
              upc++;
            }
            reportedCountArray.push(Number(values[i][3]));
          }

          reportedCountArray.sort((a, b) => {
            return b - a;
          });

          vue.$store.commit('plotsLoaded', {
            "plots": plots,
            "stats": {
              "mostReportedCount": reportedCountArray[values.length / 200 | 0], //0.995 percentile
              "capturedCount": upc,
              "lastReportTime": Number(
                values[1][4]
                .slice(0, values[1][4].indexOf(','))
              ),
              "firstReportTime": Number(
                values[values.length - 1][4]
                .slice(0, values[values.length - 1][4].indexOf(','))
              )
            }
          });
          vue.$store.commit('showMessage', `${plots.length} plots data loaded.`);
        }

      }
    }


  };
</script>
