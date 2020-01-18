<template>
</template>

<script>
  export default {

    components: {},

    methods: {
      create: async function() {

        try {
          const user = this.$auth2.currentUser.get();
          const grantRes = await user.grant({
            "scope": 'https://www.googleapis.com/auth/spreadsheets' + ' ' +
              'https://www.googleapis.com/auth/gmail.readonly'
          });
          console.log('grant res:', grantRes);
          if (grantRes) {
            console.log('try to create');
            const auth = user.getAuthResponse();
            const res = await this.$repositoryFactory.get('job').create(auth);
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
