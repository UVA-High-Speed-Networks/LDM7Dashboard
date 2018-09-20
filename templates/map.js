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

function drawMap(geoData, hosts, ldmData, date, dataType) {
  var currentHour = new Date().getHours();
////////////////////////////////////////////////////

  var hostData = [];
  for (var i = 0; i < hosts.length; i++) {
    var hostHourData = ldmData.filter(d => d.date === date && d.hour === currentHour && d.host === hosts[i].name);
    var maxByte = d3.max(hostHourData, d => d.bytes);
    var sumLatency = d3.sum(hostHourData, d => d.latency);
    var maxProduct = d3.max(hostHourData, d => d.products);
    if(isNaN(maxProduct)) maxProduct = 0;
    var throughput = maxByte/sumLatency;
    if(isNaN(throughput)) throughput = 0;
    var dic = { "host": hosts[i].name,
                // "lat": hosts[i].lat,
                // "lng": hosts[i].lng,
                "products": maxProduct,
                "throughput": throughput};
    hostData.push(dic);
  };
  // console.log(hostData);

////////////////////////////////////////////////////

  var map = d3.select("#map");

  var projection = d3.geoAlbersUsa();

  var path = d3.geoPath()
               .projection(projection);

  d3.select("#date-val").text(date);

  const color = d3.scaleThreshold()
    .domain([0,1e3,1e4,1e5,1e6,1e7])
    .range([
      'rgb(255,245,240)',
      // 'rgb(254,224,210)',
      'rgb(252,187,161)',
      'rgb(252,146,114)',
      // 'rgb(251,106,74)',
      'rgb(239,59,44)',
      'rgb(203,24,29)',
      // 'rgb(165,15,21)',
      'rgb(103,0,13)',
      ]);
  // var colorScale = d3.scale.linear().range([0, 1]);

  // console.log("color(0):" + color(0));

  // var currentHour = new Date().getHours();
  
  hosts.map(function (row) {
    var dataHost = hostData.find(function (item) {
      return row.name === item.host;
    });
    // console.log(dataHost);

    if (dataHost) {
      row.products = dataHost.products;
      row.throughput = dataHost.throughput;
    } else {
      row.products = 0;
      row.throughput = 0;
    }

    return row;
  });

  // console.log(hosts);

  // // console.log("hosts:" + hosts);

  // // svg.selectAll('*').remove();
  // hosts = hosts.filter(function(d) {
  //   return projection([d.lng, d.lat]);
  // });

  map.selectAll('.states')
    .data(geoData)
    .enter()
    .append('path')
    .attr('class', 'states')
    .attr('d', path);

    console.log(hosts);
    console.log(color(39318));
    console.log(color(37142388));
    // console.log(colorScale.domain(0, 39318));


  // draw links
  var links = map.selectAll('.link')
    .data(hosts)
    .enter();
    // colorScale.domain(d3.extent(data, function (d) { return d[colorColumn]; }))

  links.append('line')
    .style('fill', d => color(+d[dataType]))
    // .style('stroke', d => colorScale.domain(d3.extent(+d[dataType])))
    .style('stroke', d => color(+d[dataType]))
    .style('stroke-opacity', "0.6")
    .style('stroke-width', 3)
    .style('stroke-linecap', "round")
    // .style('z-index', -1)
    // .attr('class', 'link')
    .classed("link", true)
    .attr('x1', projection([hosts[0].lng, hosts[0].lat])[0])
    .attr('y1', projection([hosts[0].lng, hosts[0].lat])[1])
    .attr('x2', d => projection([d.lng, d.lat])[0])
    .attr('y2', d => projection([d.lng, d.lat])[1])
    .on('click', function() {
      // var currentDataType = d3.select("input:checked")
      //                         .property("value");
      var currentDate = "0629";

      var currentDataType = d3.select('input[name="data-type"]:checked')
                              .attr("value");

      var host = d3.select(this);
      var isActive = host.classed("active");
      // console.log("host.data():"+host.data());
      var hostName = isActive ? "" : host.data()[0].name;
      // console.log("hostName:" + hostName);
      drawBar(ldmData, hostName, currentDataType, currentDate);
      // drawLine(ldmData, hostName, "latency", currentDate);
      d3.selectAll(".link").classed("activeHost", false);
      host.classed("activeHost", !isActive);
    });


  // draw nodes
  var nodes = map.selectAll('.node')
    .data(hosts)
    .enter()
    .append('g')
    .attr('transform', function(d) {
      return 'translate(' + projection([d.lng, d.lat]) + ')';
    })
    .attr('class', 'city');


  nodes.append('circle')
    // .style('fill', d => color(+d.products))
    .style('fill', "green")
    .style("stroke", "None")
    .style('stroke-width', 2)
    .style('fill-opacity', 1)
    .classed("node", true)
		.attr('r', 6);


    // .on("click", function() {
    //   var currentDataType = d3.select("input:checked")
    //                           .property("value");
    //   var country = d3.select(this);
    //   var isActive = country.classed("active");
    //   var countryName = isActive ? "" : country.data()[0].properties.country;
    //   drawBar(climateData, currentDataType, countryName);
    //   highlightBars(+d3.select("#year").property("value"));
    //   d3.selectAll(".country").classed("active", false);
    //   country.classed("active", !isActive);
    // })
}