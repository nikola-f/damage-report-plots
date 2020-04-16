<template>
</template>

<style>
  
  .leaflet-control-navbar-fwd {
    background: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24"><path fill="%23000000" d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" /></svg>') no-repeat center center;
    display: block;
    width: 24px;
    height: 24px;
  }

  .leaflet-control-navbar-back {
    background: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24"><path fill="%23000000" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" /></svg>') no-repeat center center;
    display: block;
    width: 24px;
    height: 24px;
  }
  
  .leaflet-control-navbar-fwd-disabled {
    background: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24"><path fill="%23bbbbbb" d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" /></svg>') no-repeat center center;
    display: block;
    width: 24px;
    height: 24px;
  }
  
  .leaflet-control-navbar-back-disabled {
    background: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24"><path fill="%23bbbbbb" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" /></svg>') no-repeat center center;
    display: block;
    width: 24px;
    height: 24px;
  }
  
  .leaflet-fwd-button {
    float: right;
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-top-left-radius: 0px !important;
    border-bottom-left-radius: 0px;
    border-left: 1px solid #ccc;
  }
  .leaflet-back-button {
    float: right;
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px !important;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
</style>

<script>
// from https://github.com/davidchouse/Leaflet.NavBar


  import L from 'leaflet';
  
  
  export default {
    
    data() {
      return {
        "control": null
      };
    },
    
    mounted() {
      this.control = L.control.navbar({
        "position": 'bottomright'
      });
    },
    
    
    methods: {
      getInstance() {
        return this.control;
      }
    }
    
  };


/*
*  Simple navigation control that allows back and forward navigation through map's view history
*/

// (function() {
  L.Control.NavBar = L.Control.extend({
    options: {
      position: 'topleft',
      //center:,
      //zoom :,
      //bbox:, //Alternative to center/zoom for home button, takes precedence if included
      forwardTitle: 'Go forward in map view history',
      backTitle: 'Go back in map view history',
      // homeTitle: 'Go to home map view'
    },

    onAdd: function(map) {

      // Set options
      if (!this.options.center) {
        this.options.center = map.getCenter();
      }
      if (!this.options.zoom) {
        this.options.zoom = map.getZoom();
      }
      var options = this.options;

      // Create toolbar
      var controlName = 'leaflet-control-navbar',
      container = L.DomUtil.create('div', controlName + ' leaflet-bar');

      // Add toolbar buttons
      // this._homeButton = this._createButton(options.homeTitle, controlName + '-home', container, this._goHome);
      this._fwdButton = this._createButton(options.forwardTitle, controlName + '-fwd' + ' leaflet-fwd-button', container, this._goFwd);
      this._backButton = this._createButton(options.backTitle, controlName + '-back' + ' leaflet-back-button', container, this._goBack);

      // Initialize view history and index
      this._viewHistory = [{center: this.options.center, zoom: this.options.zoom}];
      this._curIndx = 0;
      this._updateDisabled();
      map.once('moveend', function() {this._map.on('moveend', this._updateHistory, this);}, this);
      // Set intial view to home
      map.setView(options.center, options.zoom);

      return container;
    },

    onRemove: function(map) {
      map.off('moveend', this._updateHistory, this);
    },


    _goBack: function() {
      if (this._curIndx !== 0) {
        this._map.off('moveend', this._updateHistory, this);
        this._map.once('moveend', function() {this._map.on('moveend', this._updateHistory, this);}, this);
        this._curIndx--;
        this._updateDisabled();
        var view = this._viewHistory[this._curIndx];
        this._map.setView(view.center, view.zoom);
      }
    },

    _goFwd: function() {
      if (this._curIndx != this._viewHistory.length - 1) {
        this._map.off('moveend', this._updateHistory, this);
        this._map.once('moveend', function() {this._map.on('moveend', this._updateHistory, this);}, this);
        this._curIndx++;
        this._updateDisabled();
        var view = this._viewHistory[this._curIndx];
        this._map.setView(view.center, view.zoom);
      }
    },

    _createButton: function(title, className, container, fn) {
      // Modified from Leaflet zoom control

      var link = L.DomUtil.create('a', className, container);
      link.href = '#';
      link.title = title;

      L.DomEvent
      .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
      .on(link, 'click', L.DomEvent.stop)
      .on(link, 'click', fn, this)
      .on(link, 'click', this._refocusOnMap, this);

      return link;
    },

    _updateHistory: function() {
      var newView = {center: this._map.getCenter(), zoom: this._map.getZoom()};
      var insertIndx = this._curIndx + 1;
      this._viewHistory.splice(insertIndx, this._viewHistory.length - insertIndx, newView);
      this._curIndx++;
      // Update disabled state of toolbar buttons
      this._updateDisabled();
    },

    _setFwdEnabled: function(enabled) {
      var leafletDisabled = 'leaflet-disabled';
      var fwdDisabled = 'leaflet-control-navbar-fwd-disabled';
      if (enabled === true) {
        L.DomUtil.removeClass(this._fwdButton, fwdDisabled);
        L.DomUtil.removeClass(this._fwdButton, leafletDisabled);
      }else {
        L.DomUtil.addClass(this._fwdButton, fwdDisabled);
        L.DomUtil.addClass(this._fwdButton, leafletDisabled);
      }
    },

    _setBackEnabled: function(enabled) {
      var leafletDisabled = 'leaflet-disabled';
      var backDisabled = 'leaflet-control-navbar-back-disabled';
      if (enabled === true) {
        L.DomUtil.removeClass(this._backButton, backDisabled);
        L.DomUtil.removeClass(this._backButton, leafletDisabled);
      }else {
        L.DomUtil.addClass(this._backButton, backDisabled);
        L.DomUtil.addClass(this._backButton, leafletDisabled);
      }
    },

    _updateDisabled: function() {
      if (this._curIndx == (this._viewHistory.length - 1)) {
        this._setFwdEnabled(false);
      }else {
        this._setFwdEnabled(true);
      }

      if (this._curIndx <= 0) {
        this._setBackEnabled(false);
      }else {
        this._setBackEnabled(true);
      }
    }

  });

  L.control.navbar = function(options) {
    return new L.Control.NavBar(options);
  };

//})();
</script>

