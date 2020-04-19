<template>
  <v-snackbar v-model="snackbar" :timeout="0" vertical style="opacity: 0.9">
    <div v-for="text of this.texts">
      {{ text }}
    </div>
    <v-btn icon @click="close">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-snackbar>
</template>
<script>
  export default {

    data() {
      return {
        snackbar: false,
        texts: [],
        unsubscribe: null
      };
    },
    

    beforeDestroy() {
      this.unsubscribe();
    },


    mounted() {

      setTimeout(async() => {
       this.unsubscribe = this.$store.subscribe((mutation, state) => {
          if (mutation.type !== 'showMessage') {
            return;
          }

          this.texts.push(mutation.payload);
          this.queue();
        });
      }, 0);
    },


    methods: {
      
      queue() {
        if(!this.snackbar) {
          this.snackbar = true;
        }

        setTimeout(() => {
          this.dequeue();
        }, 3000);
      },
      
      
      dequeue() {
        if(this.texts.length > 0) {
          this.texts.shift();
        }
        if(this.texts.length === 0) {
          this.snackbar = false;
        }else{
          setTimeout(() => {
            this.dequeue();
          }, 3000);
        }
      },
      
      
      close() {
        this.snackbar = false;
        this.texts = [];
      }
      
      
    }
    

  };
</script>