<template>
</template>

<script>
  const SCOPE_READ_PLOTS = 'https://www.googleapis.com/auth/spreadsheets.readonly';


  export default {

    mounted() {
      // after signin
      this.$store.subscribe(async(mutation, state) => {
        if (mutation.type !== 'signin') {
          return;
        }
        console.log('mutation:', mutation);

        // plot
        if (state.agent && state.agent.spreadsheetId) {
          const user = this.$auth2.currentUser.get();
          console.log('scopes@Plots.mounted:', user.getGrantedScopes());
          if (!user.hasGrantedScopes(SCOPE_READ_PLOTS)) {
            const res = await user.grant({
              "scope": SCOPE_READ_PLOTS
            });
            if (!res) {
              console.info('plot cancelled within no grant');
              return;
            }
          }


        }
        // start job
        else if (await this.$refs.analyzeDialog.open()) {
          this.$refs.jobLogic.create();
        }
        else {
          console.log('no go');

        }

      });
    },


    // methods: {
    //   grant: async function() {
    //     if (!this.$auth2.currentUser.get().hasGrantedScopes(SCOPE_READ_PLOTS)) {
    //       const res = await this.$auth2.currentUser.get().grant({
    //         "scope": SCOPE_READ_PLOTS
    //       });
    //       if (res) {
    //         return true;
    //       }
    //     }
    //     return false;
    //   },

    // }

  };
</script>
