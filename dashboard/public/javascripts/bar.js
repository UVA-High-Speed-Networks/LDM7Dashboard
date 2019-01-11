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

function drawBar(data, host, dataType) {
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
  
  var hostData = data.filter(d => d.hostname === host);
  
  // var currTime = new Date();
  var currTime = new Date("2018-10-01T12:08:00.000Z");
  var oneHoursAgo = d3.time.hour.offset(currTime, -1);

  var barData = [];
  for (var i = 0; i < 60; i++) {
    var d = d3.time.minute.offset(oneHoursAgo, i);
    barData.push({"time": d});
    // console.log(d.getTime());
  }
  // console.log(barData);
  
  barData.map(function (row) {
    var minuteData = hostData.find(function (item) {
      return row.time.getTime() === new Date(item.time).getTime();
    });

    if (minuteData) {
      // console.log("success");
      row.throughput = minuteData.throughput;
      row.ffdrSize = minuteData.ffdrSize;
      row.ffdrProd = minuteData.ffdrProd;
    } else {
      // console.log("fail");
      row.throughput = 0;
      row.ffdrSize = 0;
      row.ffdrProd = 0;
    }
    return row;
  });
  console.log(barData);

  // var hourData = data.filter(d => d.hostname === host);
  // var barData = [];
  
  // for (var i = 0; i < hourData.length; i++) {
  //   var time = new Date(hourData[i].time);
  //   var throughput = hourData[i].time;
  //   if(isNaN(maxProduct)) maxProduct = 0;
  //   var throughput = maxByte/sumLatency;
  //   if(isNaN(throughput)) throughput = 0;
  //   var dic = { "time": i,
  //               "throughput": throughput,
  //               "ffdrSize": ffdrSize,
  //               "ffdrProd": ffdrProd};
  //   barData.push(dic);
  // };

  // console.log(dayData);

  // var barData = [];
  // for (var i = 0; i < 24; i++) {
  //   var hourData = dayData.filter(d => d.hour === i);
  //   var maxByte = d3.max(hourData, d => d.bytes);
  //   var sumLatency = d3.sum(hourData, d => d.latency);
  //   var maxProduct = d3.max(hourData, d => d.products);
  //   if(isNaN(maxProduct)) maxProduct = 0;
  //   var throughput = maxByte/sumLatency;
  //   if(isNaN(throughput)) throughput = 0;
  //   var dic = { "hour": i,
  //               "products": maxProduct,
  //               "throughput": throughput};
  //   barData.push(dic);
  // };

  // console.log(barData);

  var xScale = d3.scaleOrdinal()
                 .domain(d3.extent(barData, d => d.time)) // (data.map(barData, d => d.hour)) 
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
      .attr("x", d => (xScale(d.time) + xScale(d3.time.hour.offset(d.time, -1))) / 2)
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






















