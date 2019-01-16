function createLine(width, height) {
  var linechart = d3.select("#line-chart")
                  .attr("width", width)
                  .attr("height", height);

  linechart.append("g")
           .classed("x-axis-line", true);

  linechart.append("g")
           .classed("y-axis-line", true);
}

// function drawLine(data, host, dataType) {
function drawLine(data, feedType, host, dataType) {
  if (host === null || host === "" || data === null || data.length === 0) {
    host = "";
    data = [];
    console.log("No data or no host selected.");
  }

  var linechart = d3.select("#line-chart");
  var padding = {
    top: 30,
    right: 30,
    bottom: 60,
    left: 60
  };
  var width = +linechart.attr("width");
  var height = +linechart.attr("height");

  var hostData = data.filter(d => d.hostname === host && d.feedtype === feedType);

  var currTime = new Date();
  // var currTime = new Date("2019-01-15T02:48:01Z");
  var oneHoursAgo = d3.time.hour.offset(currTime.setSeconds(0), -1);

  var hostHourData = [];
  for (var i = 0; i < 60; i++) {
    var d = d3.time.minute.offset(oneHoursAgo, i);
    hostHourData.push({"time": d});
  }
  
  hostHourData.map(function (row) {
    var minuteData = hostData.find(function (item) {
      var timeCal = new Date(item.time).getTime();
      return ((row.time.getTime() - timeCal < 60 * 1000) && (row.time.getTime() - timeCal > 0));
    });

    if (minuteData) {
      row.throughput = minuteData.throughput;
      row.ffdrSize = minuteData.ffdrSize;
      row.ffdrProd = minuteData.ffdrProd;
    } else {
      row.throughput = 0;
      row.ffdrSize = 0;
      row.ffdrProd = 0;
    }
    return row;
  });


// #################################
// ### chart drawing below
// #################################

  var xScale = d3.time.scale()
                .domain(d3.extent(hostHourData, d => d.time))
                .range([padding.left, width - padding.right]);
                //  .rangeRound([0, width]);
                //  .ticks(d3.time.minute, 15);
 
  var yScale = d3.scaleLinear()
                 .domain([0, d3.max(hostHourData, d => d[dataType])])
                 .range([height - padding.bottom, padding.top]);

  var xAxis = d3.axisBottom(xScale)
                // .ticks(d3.time.minute, 15);
                .ticks(d3.timeMinute.every(5));
                // .outerTickSize(0);
  
  d3.select(".x-axis-line")
      .classed("axis", true)
      .attr("transform", "translate(0, " + (height - padding.bottom) + ")")
      .call(xAxis);

  var yAxis = d3.axisLeft(yScale)
                .ticks(8, "s");
                // .tickFormat(d3.format("s"));
                // .outerTickSize(0);

  d3.select(".y-axis-line")
      .classed("axis", true)
      .attr("transform", "translate(" + padding.left + ",0)")
      .transition()
      .duration(1000)
      .call(yAxis);


  // set transition
  var t = d3.transition()
            .duration(1000);
            // .ease(d3.easeBounceOut);

  // line generator
  var line = d3.line()
              .x(function(d) { return xScale(d.time); })
              .y(function(d) { return yScale(d[dataType]); });
              // .curve(d3.curveMonotoneX);

  var lines = linechart.selectAll(".line")
          .data([hostHourData]);

  lines.exit()
    .style("opacity", 1.0)
    .transition(t)
      .delay(800)
    .style("opacity", 0.0)
    .remove();

  lines.enter()
          .append("path")
          .classed("line", true)
          .merge(lines)
          .attr("d", line)
          .style("opacity", 0.0)
          .transition(t)
            .delay(800)
          .style("opacity", 1.0);

  // dots update
  var dots = linechart
                 .selectAll(".dot")
                 .data(hostHourData);

  dots
    .exit()
    .transition(t)
      .delay((d, i, nodes) => (nodes.length - i - 1) * 10)
      .attr("cy", height - padding.bottom)
    .remove();

  dots
    .enter()
    .append("circle")
      .classed("dot", true)
      .attr("cy", height - padding.bottom)
      .attr("r", 4.5)
      .attr("stroke-width", 3)
    .merge(dots)
      .attr("cx", d => xScale(d.time))
      .transition(t)
        .delay((d, i) => i * 10)
        .attr("cy", d => yScale(d[dataType]));


  // text label for the x-axis
  linechart.append("text")      
        .attr("x", width)
        .attr("y",  height - padding.top + 10)
        .attr("class", "x-axis-label label")
        .style("text-anchor", "end")
        .text("Time");

  var units = dataType === "throughput" ? "bps" : "%";

  d3.selectAll(".y-axis-label")
      .style("opacity", 1.0)
      .transition(t)
      .style("opacity", 0.0)
      .remove();

  // text label for the y-axis
  linechart.append("text")
        .attr("x", padding.left)
        .attr("y",  padding.top / 2)
        .attr("class", "y-axis-label label")
        // .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .style("opacity", 0.0)
        .transition(t)
        .style("opacity", 1.0)
        .text(units);
        // .text(dataType + " / " + units);

  document
    .getElementById("linechart-title")
    .innerHTML 
    = formatDataType(dataType)
    + " from UCAR to " + host.toUpperCase() + " within the last 1 h";
}

