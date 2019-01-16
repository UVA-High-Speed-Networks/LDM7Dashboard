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
  ldmData = data.filter(d => d.feedtype === feedType && d.throughput !== -1);
  var hostData = [];
  for (var i = 0; i < hosts.length; i++) {
    var hostHourData = ldmData.filter(d => d.hostname === hosts[i].name);
    var sumReceivedSize = d3.sum(hostHourData, d => +d.receivedSize);
    var sumReceivedDelay = d3.sum(hostHourData, d => +d.receivedDelay);
    var sumReceivedProd = d3.sum(hostHourData, d => +d.receivedProd);
    var sumCompleteSize = d3.sum(hostHourData, d => +d.completeSize);
    var sumCompleteProd = d3.sum(hostHourData, d => +d.completeProd);
    var throughput = sumReceivedSize / sumReceivedDelay;
    var ffdrSize = 100 * sumReceivedSize / sumCompleteSize;
    var ffdrProd = 100 * sumReceivedProd / sumCompleteProd;
    if(isNaN(throughput)) throughput = 0;
    if(isNaN(ffdrSize)) ffdrSize = 0;
    if(isNaN(ffdrProd)) ffdrProd = 0;
    var dic = { "host": hosts[i].name,
                "throughput": throughput,
                "ffdrSize": ffdrSize,
                "ffdrProd": ffdrProd};
    hostData.push(dic);
  };

  var map = d3.select("#map");

  var projection = d3.geoAlbersUsa();

  var geoPath = d3.geoPath()
               .projection(projection);

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
 
  hosts.map(function (row) {
    var dataHost = hostData.find(function (item) {
      return row.name === item.host;
    });

    if (dataHost) {
      row.throughput = dataHost.throughput;
      row.ffdrSize = dataHost.ffdrSize;
      row.ffdrProd = dataHost.ffdrProd;
    } else {
      row.throughput = 0;
      row.ffdrSize = 0;
      row.ffdrProd = 0;
    }

    return row;
  });

  map.selectAll('.states')
    .data(geoData)
    .enter()
    .append('path')
    .attr('class', 'states')
    .attr('d', geoPath);


  // draw links
  var links = map.selectAll('.link')
    .data(hosts);

  links.enter()
    .append('line')
    .merge(links)
    .style("opacity", d => +d[dataType]===0 ? 0.0 : 1.0)
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
      var currentDataType = d3.select('input[name="data-type"]:checked')
                              .attr("value");
      var host = d3.select(this);
      var isActive = host.classed("active");
      var hostName = isActive ? "" : host.data()[0].name;
      drawLine(ldmData, feedType, hostName, currentDataType);
      d3.selectAll(".link").classed("activeHost", false);
      host.classed("activeHost", !isActive);
      d3.select("#line-chart").node().scrollIntoView();
    });

  links.exit().remove();

  // draw nodes
  var nodes = map.selectAll('.node')
    .data(hosts);

  // see if ucar is working well
  var hasActive = false;
  hosts.forEach(function(d) {
    hasActive = hasActive || +d.ffdrProd > 0;
  });

  nodes.enter()
    .append('g')
    .attr('transform', function(d) {
      return 'translate(' + projection([d.lng, d.lat]) + ')';
    })
    .append('circle')
    .merge(nodes)
    .style('fill', function(d) {
      if (d.name === "ucar") {
        if (hasActive) {
          return "green";
        } else {
          return "brown";
        }
      } else {
        if (+d.ffdrProd > 0 && +d.throughput > 0) {
          return "green";
        } else {
          return "brown";
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
