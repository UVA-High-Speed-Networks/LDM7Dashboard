function createBar(width, height) {
  var bar = d3.select("#bar-chart")
                  .attr("width", width)
                  .attr("height", height);

  bar.append("g")
      .classed("x-axis", true);

  bar.append("g")
      .classed("y-axis", true);
}

function drawBar(data, feedType, host, dataType) {
  var bar = d3.select("#bar-chart");
  var padding = {
    top: 30,
    right: 30,
    bottom: 60,
    left: 60
  };

  var width = +bar.attr("width");
  var height = +bar.attr("height");
  
  var hostData = data.filter(d => d.hostname === host && d.feedtype === feedType);
  
  var currTime = new Date();
  var oneHoursAgo = d3.time.hour.offset(currTime, -1).setSeconds(0);

  hostData.forEach(element => {
    element.time = new Date(element.time);
  });

  var barData = [];
  for (var i = 0; i < 60; i++) {
    var d = d3.time.minute.offset(oneHoursAgo, i);
    barData.push({"time": d});
  }
  
  barData.map(function (row) {
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

  var xScale = d3.time.scale()
                .domain([oneHoursAgo, currTime])
                .range([padding.left, width - padding.right]);


  var yScale = d3.scaleLinear()
                 .domain([0, d3.max(barData, d => d[dataType])])
                 .range([height - padding.bottom, padding.top]);

  var barWidth = 5;

  var xAxis = d3.axisBottom(xScale)
                .ticks(d3.timeMinute.every(5));

  d3.select(".x-axis")
      .classed("axis", true)
      .attr("transform", "translate(0, " + (height - padding.bottom) + ")")
      .call(xAxis);

  var yAxis = d3.axisLeft(yScale)
                .ticks(10, "s");

  d3.select(".y-axis")
      .classed("axis", true)
      .attr("transform", "translate(" + (padding.left - barWidth / 2) + ",0)")
      .transition()
      .duration(1000)
      .call(yAxis);


  var t = d3.transition()
            .duration(1000)
            .ease(d3.easeBounceOut);

  var update = bar 
                 .selectAll(".bar")
                 .data(barData);

  update
    .exit()
    .transition(t)
    .remove();

  update
    .enter()
    .append("rect")
      .classed("bar", true)
      .attr("y", height - padding.bottom)
      .attr("height", 0)
      .attr("fill", "steelblue")
    .merge(update)
      .attr("x", d => (xScale(d.time) - barWidth/2))
      .attr("width", barWidth)
      .transition(t)
        .attr("y", d => yScale(d[dataType]))
        .attr("height", d => height - padding.bottom - yScale(d[dataType]));


  // text label for the x-axis
  bar.append("text")      
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
  bar.append("text")
        .attr("x", padding.left)
        .attr("y",  padding.top / 2)
        .attr("class", "y-axis-label label")
        .style("text-anchor", "middle")
        .style("opacity", 0.0)
        .transition(t)
        .style("opacity", 1.0)
        .text(units);


  document
    .getElementById("linechart-title")
    .innerHTML 
    = formatDataType(dataType)
    + " from UCAR to " + host.toUpperCase() + " within the last 1 h";
}

