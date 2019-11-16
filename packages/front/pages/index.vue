<template>

  <Jumbotron v-if="!isSignedIn" />

</template>

<script>
  import Jumbotron from '../components/Jumbotron';
  export default {

    components: {
      Jumbotron
    },

    computed: {
      isSignedIn() {
        return this.$store.state.isSignedIn;
      }
    }


  };
</script>
