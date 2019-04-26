function createMap(width, height) {
  d3.select("#map")
      .attr("width", width)
      .attr("height", height)
    .append("text")
      .attr("x", width / 2)
      .attr("y", "1em")
      .attr("font-size", "1.5em")
      .style("text-anchor", "middle")
      .classed("map-title", true);
}

function drawMap(geoData, hosts, data, feedType, dataType) {
  if (data === null || data.length === 0) {
    data = [];
    console.log("no data");
  }
  if (feedType === null) feedType = "";

  // set currentTime variable for future timestamp comparison
  // var currentTime = new Date();
  var currentTime = new Date("2019-03-25T18:59:58Z");

  // filter out the invalid data
  ldmData = data.filter(d => d.feedtype === feedType && d.ffdrProd !== -1 && d.ffdrSize !== -1);

  // get last reported timestamp of valid data for ucar node color setting
  var lastReportTime_all = d3.max(ldmData, d => d.time);

  // aggregated one-hour data of each host, including hostname, throughput, ffdr, and last reported timestamp
  var hostsData = [];
  for (var i = 0; i < hosts.length; i++) {
    var hostHourData = ldmData.filter(d => d.hostname === hosts[i].name);

    var sumReceivedSize = d3.sum(hostHourData, d => +d.receivedSize);
    var sumReceivedProd = d3.sum(hostHourData, d => +d.receivedProd);
    var sumCompleteSize = d3.sum(hostHourData, d => +d.completeSize);
    var sumCompleteProd = d3.sum(hostHourData, d => +d.completeProd);
    var sumAggregatedLatency = d3.sum(hostHourData, d => +d.aggregatedLatency);
    var sumNegativeLatencyNum = d3.sum(hostHourData, d => +d.negativeLatencyNum);

    // How to get the throughput of max latency
    var maxLatency = d3.max(hostHourData, d => +d.maxLatency);
    var maxLatencyThru;
    hostHourData.forEach(line => {
      if (line.maxLatency === maxLatency) {
        maxLatencyThru = line.maxLatency;
      }
    });;
    
    var ffdrSize = 100 * sumReceivedSize / sumCompleteSize;
    var ffdrProd = 100 * sumReceivedProd / sumCompleteProd;
    var avgThru = 8 * sumReceivedSize / sumAggregatedLatency;
    var lastReportTime = d3.max(hostHourData, d => d.time);
    var minThru = d3.min(hostHourData, d => +d.minThru);
    var meanPercentile80Thru = d3.mean(hostHourData, d => +d.percentile80Thru);
    var negativeLatencyRatio = 100 * sumNegativeLatencyNum / sumCompleteProd;
    
    if(isNaN(ffdrSize)) ffdrSize = -1;
    if(isNaN(ffdrProd)) ffdrProd = -1;
    var dic = { "host": hosts[i].name,
                "avgThru": avgThru,
                "maxLatencyThru": maxLatencyThru,
                "minThru": minThru,
                "percentile80Thru": meanPercentile80Thru,
                // "aggregatedLatency": sumAggregatedLatency,
                "ffdrSize": ffdrSize,
                "ffdrProd": ffdrProd,
                "lastReportTime": lastReportTime,
                "negativeLatencyRatio": negativeLatencyRatio};
    hostsData.push(dic);
  };
  console.log("hostsData:", hostsData)

  var map = d3.select("#map");

  // set GeoJSON projection
  var projection = d3.geoAlbersUsa();

  // for states and counties borders
  var geoPath = d3.geoPath()
               .projection(projection);

  // set color scale for sendingHost-receivingHost-link color filling
  const color = d3.scaleThreshold()
    .domain([0,1e3,1e4,1e5,1e6,1e7])
    .range([
      'rgb(255,245,240)',
      'rgb(252,187,161)',
      'rgb(252,146,114)',
      'rgb(239,59,44)',
      'rgb(203,24,29)',
      'rgb(103,0,13)'
    ]);
 
  // insert corresponding hostsData values into hosts, containing hostsData as well as the latitude and longitude of each host 
  // to draw host nodes
  hosts.map(function (row) {
    var hostData = hostsData.find(function (item) {
      return row.name === item.host;
    });
    if (hostData) {
      row.maxLatencyThru = hostData.maxLatencyThru;
      row.percentile80Thru = hostData.percentile80Thru;
      row.avgThru = hostData.avgThru;
      row.minThru = hostData.minThru;
      row.ffdrSize = hostData.ffdrSize;
      row.ffdrProd = hostData.ffdrProd;
      row.lastReportTime = hostData.lastReportTime;
      row.negativeLatencyRatio = hostData.negativeLatencyRatio;
    } else {
      // row.minThru = -1;
      // row.percentileThru = -1;
      // row.latency = -1;
      // row.ffdrSize = -1;
      // row.ffdrProd = -1;
      row.lastReportTime = undefined;
    }
    return row;
  });

  // filter out invalid data from hosts 
  // to draw links from sending host (ucar) to receiving hosts
  // var availableHosts = hosts.filter(d => d.throughput !== -1 || d.ffdrProd !== -1 || d.ffdrSize !== -1);
  var availableHosts = hosts.filter(d => d.lastReportTime != undefined);

  console.log(hosts);

  map.selectAll('.states')
    .data(geoData)
    .enter()
    .append('path')
    .attr('class', 'states')
    .attr('d', geoPath);

  // draw links
  var links = map.selectAll('.link')
    .data(availableHosts);

  links.enter()
    .append('line')
    .merge(links)
    .style('fill', d => color(+d[dataType]))
    .style('stroke', d => color(+d[dataType]))
    .style('stroke-opacity', "0.6")
    .style('stroke-width', 3)
    .style('stroke-linecap', "round")
    .classed("link", true)
    .attr('x1', projection([hosts[0].lng, hosts[0].lat])[0])
    .attr('y1', projection([hosts[0].lng, hosts[0].lat])[1])
    .attr('x2', d => projection([d.lng, d.lat])[0])
    .attr('y2', d => projection([d.lng, d.lat])[1])
    .on('click', function() {
      // var currDataType = d3.select('input[name="data-type"]:checked')
      //                         .attr("value");
      var currDataType = d3.select("#datatype").node().value;
      var host = d3.select(this);
      var isActive = host.classed("active");
      var hostName = isActive ? "" : host.data()[0].name;
      // drawLine(ldmData, feedType, hostName, currDataType);
      drawBar(ldmData, feedType, hostName, currDataType);
      d3.selectAll(".link").classed("activeHost", false);
      host.classed("activeHost", !isActive);
      d3.select("#bar-chart").node().scrollIntoView();
    });

  links.exit().remove();

  // draw nodes
  var nodes = map.selectAll('.node')
    .data(hosts);

  nodes.enter()
    .append('g')
    .attr('transform', function(d) {
      return 'translate(' + projection([d.lng, d.lat]) + ')';
    })
    .append('circle')
    .merge(nodes)
    .style('fill', function(d) {
      if (d.name === "ucar") {
        if (typeof lastReportTime_all === "undefined") {
          return "brown";
        } else {
          if ((currentTime.getTime() - new Date(lastReportTime_all).getTime()) <= 10*60*1000) {
            return "green";
          } else {
            return "darkkhaki";
          }
        }
      } else {
        if (typeof d.lastReportTime === "undefined") {
          return "brown";
        } else {
          if ((currentTime.getTime() - new Date(d.lastReportTime).getTime()) <= 10*60*1000) {
            return "green";
          } else {
            return "darkkhaki";
          }
        }
      }
    })
    .style("stroke", "None")
    .style('stroke-width', 2)
    .style('fill-opacity', 1)
    .classed("node", true)
		.attr('r', 6);

  nodes.exit().remove();
}
