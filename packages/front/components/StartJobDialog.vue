<template>
  <v-dialog
    v-model="dialog" persistent 
    max-width="80%" max-height="90%" @keydown.esc="cancel"
  >

    <v-card color="grey darken-3" style="opacity: 0.92;" >
      <v-toolbar color="primary" dense>
        <v-toolbar-title>
          <v-icon class="mx-2">
            mdi-map-marker-plus
          </v-icon>
          Add plots
        </v-toolbar-title>
      </v-toolbar>

  <!--<v-card-text class="my-4" color="grey darken-3">-->
        

      <v-stepper v-model="e1" class="grey darken-3">
        <v-stepper-header >
          <v-stepper-step :complete="e1 > 1" step="1" editable>Description</v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step :complete="e1 > 2" step="2" editable>Entering a range</v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step step="3">Confirmation</v-stepper-step>
        </v-stepper-header>        
        
        <v-stepper-items>

          <v-stepper-content step="1">
            <v-card color="grey darken-3 overflow-y-auto" style="opacity: 0.92;" height="300px">
              <h2>Lorem</h2>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
              <h2>ipsum</h2>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </v-card>
          </v-stepper-content>
          
          <v-stepper-content step="2">
            <v-card color="grey darken-3" style="opacity: 0.92;" height="300px">
              <v-row justify="center">
                <v-col cols="12" sm="6" md="4">

                  <v-text-field
                    v-model="dateFrom"
                    label="Start date"
                    disabled
                  ></v-text-field>

                </v-col>

                <v-col cols="12" sm="6" md="4">

                  <v-menu
                    v-model="menuTo"
                    :close-on-content-click="false"
                    :nudge-right="40"
                    transition="scale-transition"
                    offset-y
                    min-width="290px"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-text-field
                        v-model="dateTo"
                        label="End date"
                        readonly
                        v-bind="attrs"
                        v-on="on"
                      ></v-text-field>
                    </template>
                    <v-date-picker v-model="dateTo" @input="menuTo = false" no-title scrollable></v-date-picker>
                  </v-menu>
                  
                </v-col>

              </v-row>
            </v-card>
          </v-stepper-content>
          
        </v-stepper-items>
      </v-stepper>


      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="cancel">CANCEL</v-btn>
        <v-btn color="accent" @click="goNext">CONTINUE</v-btn>
      </v-card-actions>

    </v-card>

  </v-dialog>
</template>

<script>

  const INGRESS_EPOCH = new Date(Date.UTC(2012, 10, 15, 0, 0, 0, 0));

  export default {
    data() {
      return {
        dialog: false,
        consent: false,
        resolve: null,
        reject: null,
        e1:null,
        menuFrom: false,
        dateFrom: INGRESS_EPOCH.toISOString().substr(0, 10),
        menuTo: false,
        dateTo: new Date().toISOString().substr(0, 10),
      };
    },

    methods: {
      open() {
        this.dialog = true;
        return new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        });
      },

      goNext() {
        this.resolve(true);
        this.dialog = false;
      },

      cancel() {
        this.resolve(false);
        this.dialog = false;
      },
    }


  };
</script>
