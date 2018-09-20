function createLine(width, height) {
  var linechart = d3.select("#line-chart")
                  .attr("width", width)
                  .attr("height", height);

  linechart.append("g")
           .classed("x-axis-line", true);

  linechart.append("g")
           .classed("y-axis-line", true);

  // linechart.append("text")
  //     .attr("transform", "rotate(-90)")
  //     .attr("x", - height / 2)
  //     .attr("dy", "1em")
  //     .style("text-anchor", "middle")
  //     .style("font-size", "1em")
  //     .classed("y-axis-label", true);

  // linechart.append("text")
  //     .attr("x", width / 2)
  //     .attr("y", "1em")
  //     .attr("font-size", "1.5em")
  //     .style("text-anchor", "middle")
  //     .classed("bar-title", true);
}

function drawLine(dayData, hour) {
  var linechart = d3.select("#line-chart");
  var padding = {
    top: 30,
    right: 30,
    bottom: 30,
    left: 110
  };
  var width = +linechart.attr("width");
  var height = +linechart.attr("height");

  var hourData = dayData.filter(d => d.hour === hour);

  console.log(hourData);


  var xScaleL = d3.scaleTime() // scaleOrdinal()
                 .domain(d3.extent(hourData, d => d.time)) // (data.map(parseData, d => d.hour)) 
                //  .range([padding.left, width - padding.right])
                 .rangeRound([padding.left, width - padding.right]);
                //  .rangeRound([0, width]);
                //  .ticks(d3.time.minute, 15);

  var yScaleL = d3.scale.linear()
                 .domain([0, d3.max(hourData, d => d["throughputNow"])])
                 .rangeRound([height - padding.bottom, padding.top]);

  var xAxisL = d3.axisBottom(xScaleL)
                .ticks(d3.time.minute, 15);
                // .outerTickSize(0);

  d3.select(".x-axis-line")
      .classed("axis", true)
      .attr("transform", "translate(0, " + (height - padding.bottom) + ")")
      .call(xAxisL);

  var yAxisL = d3.axisLeft(yScaleL)
                .ticks(10, "s");

  d3.select(".y-axis-line")
      .classed("axis", true)
      .attr("transform", "translate(" + padding.left + ",0)")
      .transition()
      .duration(1000)
      .call(yAxisL);

  var t = d3.transition()
            .duration(1000)
            .ease(d3.easeBounceOut);

  var update = linechart
                 .selectAll(".line-chart")
                 .data(hourData);

  update
    .exit()
    .transition(t)
      .delay((d, i, nodes) => (nodes.length - i - 1) * 100)
      // .attr("height", 0)
      .remove();

  update
    .enter()
    .append("path")
      .classed("line-chart", true)
      .attr("d", function(d) { return line(d.throughput); })
      .attr("stroke", 2)
    .merge(update)
      .attr("x", d => (xScale(d.hour) + xScale(d.hour - 1)) / 2)
      // .attr("width", barWidth - barPadding)
      .transition(t)
      .delay((d, i) => i * 100)
        .attr("y", d => yScale(d["throughput"]));
        // .attr("height", d => height - padding.bottom - yScale(d[dataType]));

  // document
  //   .getElementById("data-type-title")
  //   .innerHTML 
  //   = formatDataType(dataType);
  //   // + " of " + host.toUpperCase();
}






















