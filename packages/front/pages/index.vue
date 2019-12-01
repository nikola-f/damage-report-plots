<template>

  <Plots v-if="isSignedIn"/>
  <Jumbotron v-else />

</template>

<script>
  import Jumbotron from '../components/Jumbotron';
  import Plots from '../components/Plots';
  export default {

    components: {
      Plots,
      Jumbotron
    },

    computed: {
      isSignedIn() {
        return this.$store.state.isSignedIn;
      }
    }


  };
</script>
