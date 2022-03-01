function makeList(listData) {
  var html = "<ul>";
  $.each(listData,function(key,val){
      html += "\n<li>";
      if (typeof val === "object")
         html +=  key +"\n" + makeList(val);
      else
         html += val;
      html += "\n</li>";
  });
  html += "\n</ul>";
  return html;
};

function renderControllers() {
  $("#controllers-area").html(makeList(chartsData["controllers"]));
}

var labelFormatterBdev = function(value) {
    if (value >= 1000000000) {
      value = (value / 1000000000).toFixed(1) + "G";
    } else if (value >= 1000000) {
      value = (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
      value = (value / 1000).toFixed(1) + "K";
    }
    return value;
  };

  var labelFormatterReactor = function(value) {
    if (value >= 1000000000) {
      value = (value / 1000000000).toFixed(1) + "G";
    } else if (value >= 1000000) {
      value = (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
      value = (value / 1000).toFixed(1) + "K";
    }
    return value;
  };
  
  var chartsDom = {
    bdevs: {
      domCheck: {},
      container: $('#bdev-area'),
      chartOptions: {
        series: [], // { type: "area", data: [] }
        chart: {
          dropShadow: {
            enabled: true,
            top: 2,
            left: 4,
            blur: 4,
            opacity: 0.5
          },
          foreColor: '#ccc',
          group: 'chart-bdevs',
          height: 300,
          type: "area",
          stacked: false,
          animations: { enabled: false, easing: 'linear', dynamicAnimation: { speed: 950 } },
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'stepline', width: 1,},
        fill: { type: "gradient", opacity: 1, },
        title: { text: ''},
        xaxis: { type: 'datetime', range: 300000, labels: {datetimeUTC: false,}},
        yaxis: { labels: { formatter: labelFormatterBdev } },
        tooltip: {
          theme: 'dark',
          x: {format: 'HH:mm:ss'},
        },
        grid: { borderColor: "#535A6C", xaxis: { lines: { show: false } }, },
      },
      charts: {}, // {"aio0": {handler: xxx, series: xxx}}
    },

    reactors: {
      domCheck: {},
      container: $('#reactor-area'),
      chartOptions: {
        series: [], // { type: "area", data: [] }
        chart: {
          foreColor: '#ccc',
          group: 'chart-reactors',
          height: 300,
          type: "area",
          stacked: true,
          animations: { enabled: false, easing: 'linear', dynamicAnimation: { speed: 950 } },
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        dataLabels: { enabled: false },
        stroke: {  curve: 'stepline', width: 1,},
        fill: { type: "gradient", opacity: 1, colors: ['#d5d5d5'],},
        title: { text: ''},
        xaxis: { type: 'datetime', range: 300000, labels: {datetimeUTC: false,}},
        yaxis: { labels: { formatter: labelFormatterReactor } },
        tooltip: {
          theme: 'dark',
          x: {format: 'HH:mm:ss'},
        },
        grid: { borderColor: "#535A6C", xaxis: { lines: { show: false } }, },
        theme: { palette: 'palette9', },
      },
      charts: {}, // {"aio0": {handler: xxx, series: xxx}}
    }, // chart: xxx, data: xxx
  };

  function renderBdevs() {
    for (const [devName, v] of Object.entries(chartsData.bdevs)) {
      if (v.data == null) {
        continue;
      }

      $("#loading-area").hide();
      $("#chart-area").show();

      if (!('chart-bdev-' + devName+'-title' in chartsDom.bdevs.domCheck)) {
        chartsDom.bdevs.container.append('<div class="col-sm-12"><nav aria-label="breadcrumb"> <ol style="background-color: #232536; box-shadow: 8px 6px 17px 0px rgb(0 0 0 / 11%);" class="breadcrumb"> <li class="breadcrumb-item active" aria-current="page"><h4 style="margin-bottom: 0; color: #cfcfcf;"><svg width="30" height="30" class="bi"><use xlink:href="assets/css/bootstrap-icons.svg#hdd-network"/></svg>&nbsp;&nbsp;Device '+ devName + '</h4></li> </ol> </nav></div>');
        chartsDom.bdevs.domCheck['chart-bdev-' + devName+'-title'] = true;
      }
      

      if (!(devName+"-bytesread" in chartsDom.bdevs.charts)) {
        // bytes Chart not exists, need create
        chartsDom.bdevs.charts[devName+"-bytesread"] = {};
        chartsDom.bdevs.container.append('<div class="col-lg-6"><div class="box shadow mb-4"><div id="chart-bdev-' + devName + '-bytesread"></div></div></div>');
        chartsDom.bdevs.charts[devName+"-bytesread"]["handler"] = new ApexCharts(document.querySelector("#chart-bdev-"+devName+"-bytesread"), $.extend(true, {}, chartsDom.bdevs.chartOptions, {theme: { 'palette': 'palette5' }, 'title': {text: 'Read Bytes / second ( '+ devName + ' )'}, 'chart':{'id': 'chart-id-bdev-bytesread-'+devName}}));
        chartsDom.bdevs.charts[devName+"-bytesread"]["handler"].render();
        chartsDom.bdevs.charts[devName+"-bytesread"]["series"] = [
          { name: "Read/s", data: [[v.data.Timestamp - 1000, 0]] },
        ];

        // bytes Chart not exists, need create
        chartsDom.bdevs.charts[devName+"-byteswrite"] = {};
        chartsDom.bdevs.container.append('<div class="col-lg-6"><div class="box shadow mb-4"><div id="chart-bdev-' + devName + '-byteswrite"></div></div></div>');
        chartsDom.bdevs.charts[devName+"-byteswrite"]["handler"] = new ApexCharts(document.querySelector("#chart-bdev-"+devName+"-byteswrite"), $.extend(true, {}, chartsDom.bdevs.chartOptions, {theme: { 'palette': 'palette8' }, 'title': {text: 'Write Bytes / second ( '+ devName + ' )'}, 'chart':{'id': 'chart-id-bdev-byteswrite-'+devName}}));
        chartsDom.bdevs.charts[devName+"-byteswrite"]["handler"].render();
        chartsDom.bdevs.charts[devName+"-byteswrite"]["series"] = [
          { name: "Write/s", data: [[v.data.Timestamp - 1000, 0]] }
        ];

        // bytes Chart not exists, need create
        chartsDom.bdevs.charts[devName+"-iops"] = {};
        chartsDom.bdevs.container.append('<div class="col-lg-6"><div class="box shadow mb-4"><div id="chart-bdev-' + devName + '-iops"></div></div></div>');
        chartsDom.bdevs.charts[devName+"-iops"]["handler"] = new ApexCharts(document.querySelector("#chart-bdev-"+devName+"-iops"), $.extend(true, {}, chartsDom.bdevs.chartOptions, {'title': {text: 'IOPS ( '+ devName + ' )'}, 'chart':{'id': 'chart-id-bdev-iops-'+devName}}));
        chartsDom.bdevs.charts[devName+"-iops"]["handler"].render();
        chartsDom.bdevs.charts[devName+"-iops"]["series"] = [
          { name: "Read IOPS", data: [[v.data.Timestamp - 1000, 0]] },
          { name: "Write IOPS", data: [[v.data.Timestamp - 1000, 0]] }
        ];

        // bytes Chart not exists, need create
        chartsDom.bdevs.charts[devName+"-latency"] = {};
        chartsDom.bdevs.container.append('<div class="col-lg-6"><div class="box shadow mb-4"><div id="chart-bdev-' + devName + '-latency"></div></div></div>');
        chartsDom.bdevs.charts[devName+"-latency"]["handler"] = new ApexCharts(document.querySelector("#chart-bdev-"+devName+"-latency"), $.extend(true, {}, chartsDom.bdevs.chartOptions, {'title': {text: 'Latency Ticks ( '+ devName + ' )'}, 'chart':{'id': 'chart-id-bdev-latency-'+devName}}));
        chartsDom.bdevs.charts[devName+"-latency"]["handler"].render();
        chartsDom.bdevs.charts[devName+"-latency"]["series"] = [
          { name: "Read Latency", data: [[v.data.Timestamp - 1000, 0]] },
          { name: "Write Latency", data: [[v.data.Timestamp - 1000, 0]] }
        ];
        
        chartsDom.bdevs.charts[devName+"-bytesread"]["handler"].updateSeries(chartsDom.bdevs.charts[devName+"-bytesread"]["series"], false);
        chartsDom.bdevs.charts[devName+"-byteswrite"]["handler"].updateSeries(chartsDom.bdevs.charts[devName+"-byteswrite"]["series"], false);
        chartsDom.bdevs.charts[devName+"-iops"]["handler"].updateSeries(chartsDom.bdevs.charts[devName+"-iops"]["series"], false);
        chartsDom.bdevs.charts[devName+"-latency"]["handler"].updateSeries(chartsDom.bdevs.charts[devName+"-latency"]["series"], false);
      }

      // Pushing new data
      chartsDom.bdevs.charts[devName+"-bytesread"]["series"][0].data.push([v.data.Timestamp, v.data.BytesRead]);
      chartsDom.bdevs.charts[devName+"-byteswrite"]["series"][0].data.push([v.data.Timestamp, v.data.BytesWrite]);
      chartsDom.bdevs.charts[devName+"-iops"]["series"][0].data.push([v.data.Timestamp, v.data.NumReadOps]);
      chartsDom.bdevs.charts[devName+"-iops"]["series"][1].data.push([v.data.Timestamp, v.data.NumWriteOps]);
      chartsDom.bdevs.charts[devName+"-latency"]["series"][0].data.push([v.data.Timestamp, v.data.ReadLatencyTicks]);
      chartsDom.bdevs.charts[devName+"-latency"]["series"][1].data.push([v.data.Timestamp, v.data.WriteLatencyTicks]);

      // Clean up old data
      var cutDataLen = chartsDom.bdevs.charts[devName+"-bytesread"]["series"][0].data.length - 301;
      if (cutDataLen > 0) {
        chartsDom.bdevs.charts[devName+"-bytesread"]["series"][0].data = chartsDom.bdevs.charts[devName+"-bytesread"]["series"][0].data.slice(cutDataLen);
        chartsDom.bdevs.charts[devName+"-byteswrite"]["series"][0].data = chartsDom.bdevs.charts[devName+"-byteswrite"]["series"][0].data.slice(cutDataLen);
        chartsDom.bdevs.charts[devName+"-iops"]["series"][0].data = chartsDom.bdevs.charts[devName+"-iops"]["series"][0].data.slice(cutDataLen);
        chartsDom.bdevs.charts[devName+"-iops"]["series"][1].data = chartsDom.bdevs.charts[devName+"-iops"]["series"][1].data.slice(cutDataLen);
        chartsDom.bdevs.charts[devName+"-latency"]["series"][0].data = chartsDom.bdevs.charts[devName+"-latency"]["series"][0].data.slice(cutDataLen);
        chartsDom.bdevs.charts[devName+"-latency"]["series"][1].data = chartsDom.bdevs.charts[devName+"-latency"]["series"][1].data.slice(cutDataLen);
      }

      // Now updating series
      chartsDom.bdevs.charts[devName+"-bytesread"]["handler"].updateSeries(chartsDom.bdevs.charts[devName+"-bytesread"]["series"], false);
      chartsDom.bdevs.charts[devName+"-byteswrite"]["handler"].updateSeries(chartsDom.bdevs.charts[devName+"-byteswrite"]["series"], false);
      chartsDom.bdevs.charts[devName+"-iops"]["handler"].updateSeries(chartsDom.bdevs.charts[devName+"-iops"]["series"], false);
      chartsDom.bdevs.charts[devName+"-latency"]["handler"].updateSeries(chartsDom.bdevs.charts[devName+"-latency"]["series"], false);

      
      if (!('chart-bdev-' + devName+'-hr' in chartsDom.bdevs.domCheck)) {
        chartsDom.bdevs.container.append('<div class="col-sm-12"><br></div>');
        chartsDom.bdevs.domCheck['chart-bdev-' + devName+'-hr'] = true;
      }

    } // devName for loop    
  } // EoF


  function renderReactors() {
    for (const [reactorName, v] of Object.entries(chartsData.reactors)) {
      if (v.data == null) {
        continue;
      }

      $("#loading-area").hide();
      $("#chart-area").show();

      if (!('chart-reactor-title' in chartsDom.reactors.domCheck)) {
        chartsDom.reactors.container.append('<div class="col-sm-12"><nav aria-label="breadcrumb"> <ol style="background-color: #232536; box-shadow: 8px 6px 17px 0px rgb(0 0 0 / 11%);" class="breadcrumb"> <li class="breadcrumb-item active" aria-current="page"><h4 style="margin-bottom: 0; color: #cfcfcf;"><svg width="30" height="30" class="bi"><use xlink:href="assets/css/bootstrap-icons.svg#cpu"/></svg>&nbsp;&nbsp;SPDK Reactors</h4></li> </ol> </nav></div>');
        chartsDom.reactors.domCheck['chart-reactor-title'] = true;
      }

      // Render reactor chart
      if (!(reactorName+"-workload" in chartsDom.reactors.charts)) {
        // bytes Chart not exists, need create
        chartsDom.reactors.charts[reactorName+"-workload"] = {};
        chartsDom.reactors.container.append('<div class="col-lg-6"><div class="box shadow mb-4"><div id="chart-reactor-' + reactorName + '-workload"></div></div></div>');
        chartsDom.reactors.charts[reactorName+"-workload"]["handler"] = new ApexCharts(document.querySelector("#chart-reactor-"+reactorName+"-workload"), $.extend(true, {}, chartsDom.reactors.chartOptions, {'title': {text: reactorName}, 'chart':{'id': 'chart-id-reactor-'+reactorName}}));
        chartsDom.reactors.charts[reactorName+"-workload"]["handler"].render();
        chartsDom.reactors.charts[reactorName+"-workload"]["series"] = [
          { name: "Busy Cycle", data: [[v.data.Timestamp - 1000, 0]] },
          { name: "Idle Cycle", data: [[v.data.Timestamp - 1000, 0]] },
        ];
        
        chartsDom.reactors.charts[reactorName+"-workload"]["handler"].updateSeries(chartsDom.reactors.charts[reactorName+"-workload"]["series"], false);
      }
      

      // Pushing new data
      chartsDom.reactors.charts[reactorName+"-workload"]["series"][0].data.push([v.data.Timestamp, v.data.Busy]);
      chartsDom.reactors.charts[reactorName+"-workload"]["series"][1].data.push([v.data.Timestamp, v.data.Idle]);

      // Clean up old data
      // Clean up old data
      var cutDataLen = chartsDom.reactors.charts[reactorName+"-workload"]["series"][0].data.length-301;
      if (cutDataLen > 0) {
        chartsDom.reactors.charts[reactorName+"-workload"]["series"][0].data = chartsDom.reactors.charts[reactorName+"-workload"]["series"][0].data.slice(cutDataLen);
        chartsDom.reactors.charts[reactorName+"-workload"]["series"][1].data = chartsDom.reactors.charts[reactorName+"-workload"]["series"][1].data.slice(cutDataLen);
      }
      
      // Now updating series
      chartsDom.reactors.charts[reactorName+"-workload"]["handler"].updateSeries(chartsDom.reactors.charts[reactorName+"-workload"]["series"], false );

    } // devName for loop   
  }
  
  
  function render() {
    renderControllers();
    renderBdevs();
    renderReactors();
  }
  

  // {
  //   "Bdev-aio0": {"ts": xxx, "last": {}, "data": []},
  //   "Reactor-Reactor-0": {"ts": xxx,"last": {}, "data": []},
  // }
  var chartsData = {"bdevs": {}, "reactors": {}, "controllers": {}};

  function processData(obj) {
    for (const [k, v] of Object.entries(obj.Metrics.BdevIostat.Bdevs)) {
      if (!(k in chartsData["bdevs"])) {
        chartsData["bdevs"][k] = {"ts": null, "last": null, data: null};
      }

      if (chartsData["bdevs"][k]["ts"] != null) {
        var deltaSec =  (obj.Metrics.BdevIostat.Timestamp - chartsData["bdevs"][k]["ts"]) / 1000.0;
        chartsData["bdevs"][k]["data"] = {
          "Timestamp": obj.Timestamp,
          "BytesRead": (v.BytesRead - chartsData["bdevs"][k]["last"].BytesRead) / deltaSec,
          "BytesWrite": (v.BytesWrite - chartsData["bdevs"][k]["last"].BytesWrite) / deltaSec,
          "NumReadOps": parseInt((v.NumReadOps - chartsData["bdevs"][k]["last"].NumReadOps) / deltaSec),
          "NumWriteOps": parseInt((v.NumWriteOps - chartsData["bdevs"][k]["last"].NumWriteOps) / deltaSec),
          "ReadLatencyTicks": (v.ReadLatencyTicks - chartsData["bdevs"][k]["last"].ReadLatencyTicks) / deltaSec,
          "WriteLatencyTicks": (v.WriteLatencyTicks - chartsData["bdevs"][k]["last"].WriteLatencyTicks) / deltaSec,
        };
      }
      chartsData["bdevs"][k]["last"] = v;
      chartsData["bdevs"][k]["ts"] = obj.Metrics.BdevIostat.Timestamp;
    }

    for (const [k, v] of Object.entries(obj.Metrics.FrameworkReactors.Reactors)) {
      if (!(k in chartsData["reactors"])) {
        chartsData["reactors"][k] = {"ts": null, "last": null, data: null};
      }

      if (chartsData["reactors"][k]["ts"] != null) {
        var deltaSec =  (obj.Metrics.FrameworkReactors.Timestamp - chartsData["reactors"][k]["ts"]) / 1000.0;
        chartsData["reactors"][k]["data"] = {
          "Timestamp": obj.Timestamp,
          "Busy": parseInt((v.Busy - chartsData["reactors"][k]["last"].Busy) / deltaSec),
          "Idle": parseInt((v.Idle - chartsData["reactors"][k]["last"].Idle) / deltaSec),
        };
      }
      chartsData["reactors"][k]["last"] = v;
      chartsData["reactors"][k]["ts"] = obj.Metrics.FrameworkReactors.Timestamp;
    }

    chartsData["controllers"] = obj.Metrics.NvmfSubsystemControllers.Controllers;
    
  }
  
  function init() {
    var uri = 'ws://' + window.location.host + window.location.pathname + 'ws';
    if (window.location.protocol === 'https:') {
      uri = 'wss://' + window.location.host + window.location.pathname + 'ws';
    }
    ws = new WebSocket(uri)
    ws.onopen = function() {
      console.log('Websocket connected, start rendering...');
    };
    ws.onmessage = function(evt) {
      var out = document.getElementById('chart-area');
      processData(JSON.parse(evt.data));
      render();
    };
  }

  $(document).ready(function() {
    init();
  });
