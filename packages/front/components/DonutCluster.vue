<template>
</template>
<style>
  .donut-text {
    color: white;
    display: block;
    position: absolute;
    top: 50%;
    left: 0;
    z-index: 2;
    line-height: 0;
    width: 100%;
    text-align: center;
    font-family: 'Exo', sans-serif;
  }
</style>
<script>
  // origin : https://github.com/akq/Leaflet.DonutCluster

  import L from 'leaflet';
  import 'leaflet.markercluster';

  const CLUSTER_OPTION = {
    "chunkedLoading": true,
    "chunkInterval": 3000,
    "maxClusterRadius": 75,
    "spiderfyOnMaxZoom": false,
    "disableClusteringAtZoom": 16,
    "polygonOptions": {
      "color": "#49ebc3" // C
    },
    "iconCreateFunction": null
  };
  const DONUT_OPTION = {
    "key": 'elapsed',
    "arcColorDict": {
      "C": "#49ebc3",
      "R": "#b68bff",
      "VR": "#f781ff"
    },
    "order": ["C", "R", "VR"],
  };



  export default {

    data() {
      return {
        "cluster": null,
      };
    },


    mounted() {

      CLUSTER_OPTION.iconCreateFunction = (cluster) => {

        const markers = cluster.getAllChildMarkers();
        const myDonut = createDonut(markers, DONUT_OPTION, (points) => {
          let style;
          if (!DONUT_OPTION.style) {
            style = defaultStyle(points);
          }
          else {
            if (typeof DONUT_OPTION.style == 'function') {
              style = DONUT_OPTION.style(points);
            }
            else style = DONUT_OPTION.style;
          }
          return {
            size: style.size,
            weigth: style.weight,
            colors: DONUT_OPTION.arcColorDict,
            fillColor: style.fill
          };
        });

        return new L.divIcon({
          html: myDonut,
          iconSize: new L.Point(myDonut.config.size + 10, myDonut.config.size + 10),
          className: 'donut-cluster'
        });
      };

      this.cluster = L.markerClusterGroup(CLUSTER_OPTION);

    },


    methods: {
      getCluster() {
        return this.cluster;
      }
    },
  };


  let donutData = {},
    dataIndex = 0;

  const roundToTwo = (num) => {
    return +(Math.round(num + "e+2") + "e-2");
  };

  const readable = (val) => {
    if (val >= 1000 && val < 1000000)
      val = roundToTwo(val / 1000) + 'K';
    else if (val >= 1000000 && val < 1000000000)
      val = roundToTwo(val / 1000000) + 'M';
    else if (val >= 1000000000)
      val = roundToTwo(val / 1000000000) + 'B';
    return val;
  };


  const createDonut = (points, opt, cfgFn) => {
    // console.log('createDonut called:', points);
    let blocks = {},
      count = points.length,
      key = opt.key,
      sumField = opt.sumField,
      fieldList = opt.order || (opt.order = []),
      fieldDict = opt.orderDict || (opt.orderDict = {}),
      titleDict = opt.title || {},
      cfg = {};
    if (typeof cfgFn == 'function') {
      cfg = cfgFn(points);
    }
    else if (typeof cfgFn == 'object') {
      cfg = cfgFn;
    }
    if (Array.isArray(opt.title) && opt.order) {
      titleDict = {};
      for (let i in opt.title) {
        titleDict[opt.order[i]] = opt.title[i];
      }
      opt.title = titleDict;
    }
    for (let i in fieldList) {
      fieldDict[fieldList[i]] = 1;
    }

    for (var i = 0; i < count; i++) {
      var s = points[i].options[key];
      if (!blocks[s]) {
        blocks[s] = 0;
      }
      if (!fieldDict[s]) {
        fieldDict[s] = 1;
        fieldList.push(s);
      }

      if (!sumField) {
        blocks[s]++;
      }
      else blocks[s] += points[i].options[sumField];
    }
    var list = [];

    for (let i in fieldList) {
      let s = fieldList[i];
      list.push({
        value: blocks[s] || 0,
        name: s,
        title: titleDict[s],
        active: cfg.active && cfg.active == s
      });
    }

    const size = cfg.size || 50,
      weight = cfg.weight || 10,
      colors = cfg.colors;

    const myDonut = donut({
      size: size,
      weight: weight,
      data: list,
      onclick: cfg.onclick,
      colors: colors,
      fillColor: cfg.fillColor
    });
    myDonut.config = cfg;
    return myDonut;
  };


  const donut = (options) => {
    let div = document.createElement('div'),
      size = options.size || 100,
      size0 = size + 10,
      data = options.data || [{
        value: 1
      }],
      weight = 5,
      colors = options.colors || ['#555'],
      fillColor = options.fillColor || '#f1d357',
      el = options.el,
      r = size / 2,
      sum = 0,
      i,
      value,
      arc,
      text,
      setAttribute = (el, o) => {
        for (var j in o) {
          el.setAttribute(j, o[j]);
        }
      };

    for (i = 0; i < data.length; i++) {
      sum += data[i].value;
    }

    if (sum == 0) {
      for (i = 0; i < data.length; i++) {
        data[i].value = 1;
        sum += data[i].value;
      }
    }
    div.className = 'donut';
    div.style.width = div.style.height = size0 + 'px';
    div.style.position = 'relative';

    text = div.appendChild(document.createElement('span'));

    text.className = 'donut-text';

    text.innerHTML = readable(sum);

    var NS = 'http://www.w3.org/2000/svg',
      svg = document.createElementNS(NS, 'svg'),
      startAngle = -Math.PI / 2,
      arcRadius = r - weight / 2;

    svg.setAttribute('height', size0 + 'px');
    svg.setAttribute('width', size0 + 'px');

    var circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', size0 / 2.0);
    circle.setAttribute('cy', size0 / 2.0);
    circle.setAttribute('r', arcRadius - weight / 2);
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('fill-opacity', 0.6);
    svg.appendChild(circle);

    div.appendChild(svg);

    for (i = 0; i < data.length; i++) {
      value = data[i].value / sum;
      value = value === 1 ? .99999 : value;
      arc = document.createElementNS(NS, 'path');
      var r1 = r + 5;
      var segmentAngle = value * Math.PI * 2,
        endAngle = segmentAngle + startAngle,
        largeArc = ((endAngle - startAngle) % (Math.PI * 2)) > Math.PI ? 1 : 0,
        startX = r1 + Math.cos(startAngle) * arcRadius,
        startY = r1 + Math.sin(startAngle) * arcRadius,
        endX = r1 + Math.cos(endAngle) * arcRadius,
        endY = r1 + Math.sin(endAngle) * arcRadius;

      var name = data[i].name,
        c = Array.isArray(colors) ? colors[i % colors.length] : (colors[name] || '#fff');

      startAngle = endAngle;

      setAttribute(arc, {
        d: [
          'M', startX, startY,
          'A', arcRadius, arcRadius, 0, largeArc, 1, endX, endY
        ].join(' '),
        stroke: c,
        'stroke-opacity': "0.7",
        'stroke-width': weight,
        fill: 'none',
        'data-name': name,
        'class': 'donut-arc'
      });
      donut.data(arc, data[i]);

      ((d, c, perc) => {
        if (perc == '99.99')
          perc = '100';
        if (options.onclick) {
          arc.addEventListener('click', (e) => {
            let t = e.target,
              val = readable(d.value);
            if (t.parentNode.stick != t) {
              t.parentNode.stick = t;
            }
            else t.parentNode.stick = false;
            options.onclick(d.name, !!t.parentNode.stick);
          });
        }

      })(data[i], c, (value * 100 + '').substr(0, 5));
      svg.appendChild(arc);
      if (data[i].active) {
        svg.stick = arc;
        arc.setAttribute('stroke-width', weight);
      }
    }


    if (el) {
      el.appendChild(div);
    }

    return div;
  };


  donut.data = (arc, data) => {
    if (typeof data === 'undefined') {
      return donutData[arc._DONUT];
    }
    else {
      donutData[arc._DONUT = arc._DONUT || ++dataIndex] = data;
      return arc;
    }
  };

  donut.setColor = (arc, color) => {
    arc.setAttribute('stroke', color);
    return arc;
  };

  const defaultStyle = (points) => {
    var count = points.length,
      size, weight;
    if (count < 10) {
      size = 40;
      weight = 8;
    }
    else if (count < 100) {
      size = 50;
      weight = 10;
    }
    else if (count < 1000) {
      size = 60;
      weight = 12;
    }
    else {
      size = 70;
      weight = 14;
    }
    return {
      size: size,
      weight: weight,
      fill: "#111111"
    };
  };
</script>
