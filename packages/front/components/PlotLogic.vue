<template>
</template>

<script>
  import Vue from 'vue';
  // import google from 'googleapis';
  // const sheets = google.sheets('v4');
  const SCOPE_READ_PLOTS = 'https://www.googleapis.com/auth/spreadsheets.readonly';


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
        console.info('try to get plots data from spreadsheets:', vue.$store.state.agent.spreadsheetId);
        const res = await vue.$gapi.client.sheets.spreadsheets.values.get({
          "spreadsheetId": vue.$store.state.agent.spreadsheetId,
          "range": 'aggregated!A:E',
        });
        // console.log(res);

        if (res.result && res.result.values) {
          const plots = [];
          for (let i = 1; i < res.result.values.length; i++) { // skip 1st row
            plots.push([
              Number(res.result.values[i][0]), // lat
              Number(res.result.values[i][1]), // long
              res.result.values[i][2] === "1" ? true : false, // upc
              Number(res.result.values[i][3]), // reported count
              Number(
                res.result.values[i][4]
                .slice(0, res.result.values[i][4].indexOf(','))
              ), // last reported at
              res.result.values[i][4]
              .slice(res.result.values[i][4].indexOf(',') + 1) // portal name
            ]);
          }

          vue.$store.commit('plotsLoaded', plots);
          // console.log(vue.$store.state.plots);
        }

      }
    }


  };
</script>
