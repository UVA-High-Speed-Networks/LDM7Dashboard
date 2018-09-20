function createBar(width, height) {
  var bar = d3.select("#bar-chart")
                  .attr("width", width)
                  .attr("height", height);

  bar.append("g")
      .classed("x-axis", true);

  bar.append("g")
      .classed("y-axis", true);

  // bar.append("text")
  //     .attr("transform", "rotate(-90)")
  //     .attr("x", - height / 2)
  //     .attr("dy", "1em")
  //     .style("text-anchor", "middle")
  //     .style("font-size", "1em")
  //     .classed("y-axis-label", true);

//   bar.append("text")
//       .attr("x", width / 2)
//       .attr("y", "1em")
//       .attr("font-size", "1.5em")
//       .style("text-anchor", "middle")
//       .classed("bar-title", true);
}

function drawBar(data, host, dataType, date) {
  var bar = d3.select("#bar-chart");
  var padding = {
    top: 30,
    right: 30,
    bottom: 30,
    left: 110
  };
  var barPadding = 1;
  var width = +bar.attr("width");
  var height = +bar.attr("height");

  var dayData = data.filter(d => d.host === host && d.date === date)
                      .sort((a, b) => a.hour - b.hour);

  // console.log(dayData);

  var barData = [];
  for (var i = 0; i < 24; i++) {
    var hourData = dayData.filter(d => d.hour === i);
    var maxByte = d3.max(hourData, d => d.bytes);
    var sumLatency = d3.sum(hourData, d => d.latency);
    var maxProduct = d3.max(hourData, d => d.products);
    if(isNaN(maxProduct)) maxProduct = 0;
    var throughput = maxByte/sumLatency;
    if(isNaN(throughput)) throughput = 0;
    var dic = { "hour": i,
                "products": maxProduct,
                "throughput": throughput};
    barData.push(dic);
  };

  // console.log(barData);

  var xScale = d3.scaleLinear() // scaleOrdinal()
                 .domain(d3.extent(barData, d => d.hour)) // (data.map(barData, d => d.hour)) 
                 .range([padding.left, width - padding.right]);
                // .rangeRoundBands([0, width - padding.left - padding.right], .05);
                 
  // console.log(dayData);
  // console.log(barData);
  // console.log(d3.max(barData, d => d[dataType]))

  var yScale = d3.scaleLinear()
                 .domain([0, d3.max(barData, d => d[dataType])])
                 .range([height - padding.bottom, padding.top]);

  var barWidth = xScale(xScale.domain()[0] + 1) - xScale.range()[0];

  var xAxis = d3.axisBottom(xScale)
                .tickFormat(d3.format(".0f"));

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

  // var axisLabel = dataType === "throughput" ?
  //   "Throughput" :
  //   "Received Products";

  // var barTitle = date ?
  //   "daily data on " + date + " of " + host:
  //   "Select a date to see daily data visualization.";

  // d3.select(".y-axis-label")
  //     .text(axisLabel);

  // d3.select(".bar-title")
  //     .text(barTitle);

  var t = d3.transition()
            .duration(1000)
            .ease(d3.easeBounceOut);

  var update = bar 
                 .selectAll(".bar")
                 .data(barData);

  update
    .exit()
    .transition(t)
      .delay((d, i, nodes) => (nodes.length - i - 1) * 100)
      .attr("y", height - padding.bottom)
      .attr("height", 0)
      .remove();

  update
    .enter()
    .append("rect")
      .classed("bar", true)
      .attr("y", height - padding.bottom)
      .attr("height", 0)
      .on('click', function() {
        var currentDataType = d3.select('input[name="data-type"]:checked')
                                .attr("value");
        if (currentDataType === "throughput") {
          var currentHour = d3.select(this);
          // drawLine(dayData, currentHour);
        } 
        // else {
        //   continue;
        // }
      })
    .merge(update)
      .attr("x", d => (xScale(d.hour) + xScale(d.hour - 1)) / 2)
      .attr("width", barWidth - barPadding)
      .transition(t)
      .delay((d, i) => i * 100)
        .attr("y", d => yScale(d[dataType]))
        .attr("height", d => height - padding.bottom - yScale(d[dataType]));

  document
    .getElementById("data-type-title")
    .innerHTML 
    = formatDataType(dataType);
    // + " of " + host.toUpperCase();
}






















