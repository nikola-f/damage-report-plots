<template>
</template>

<script>
  const SCOPE_JOB =
    'https://www.googleapis.com/auth/spreadsheets ' +
    'https://www.googleapis.com/auth/gmail.readonly';

  export default {

    components: {},

    methods: {
      create: async (rangeToTime) => {

        try {
          const user = this.$auth2.currentUser.get();
          const grantRes = await user.grant({
            "scope": SCOPE_JOB
          });
          console.log('grant res:', grantRes);
          if (grantRes) {
            console.log('try to create');
            const auth = user.getAuthResponse();
            const res = await this.$repositoryFactory.get('job').create({
              "auth": auth,
              "rangeToTime": rangeToTime
            });
            console.log('res@job.create', res);
          }

        }
        catch (err) {
          console.error(err);
          throw err;
        }


      },

      isAvailable: async function() {

      }
    }
  };
</script>
