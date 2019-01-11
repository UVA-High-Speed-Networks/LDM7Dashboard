function createLine(width, height) {
  var linechart = d3.select("#line-chart")
                  .attr("width", width)
                  .attr("height", height);

  linechart.append("g")
           .classed("x-axis-line", true);

  linechart.append("g")
           .classed("y-axis-line", true);
}

function drawLine(data, host, dataType) {
  //***************************************
  var linechart = d3.select("#line-chart");

  var margin = {top: 30, right: 30, bottom: 60, left: 110}
  , width = +linechart.attr("width") - margin.left - margin.right // Use the window's width 
  , height = +linechart.attr("height") - margin.top - margin.bottom; // Use the window's height

  var hostData = data.filter(d => d.hostname === host);

  var currTime = new Date("2018-10-01T12:08:00.000Z");
  var oneHoursAgo = d3.time.hour.offset(currTime, -1);

  var hostHourData = [];
  for (var i = 0; i < 60; i++) {
    var d = d3.time.minute.offset(oneHoursAgo, i);
    hostHourData.push({"time": d});
    // console.log(d.getTime());
  }
  // console.log(hostHourData);
  
  hostHourData.map(function (row) {
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
  console.log(hostHourData);

  var units = dataType === "throughput" ? "bps" : "%";

  // 5. X scale will use the time
  var xScale = d3.time.scale()
      .domain(d3.extent(hostHourData, d => d.time)) // input
      .range([0, width]); // output

  // 6. Y scale will use the value of selected datatype 
  var yScale = d3.scaleLinear()
      .domain([0, d3.max(hostHourData, d => d[dataType])]) // input 
      .range([height, 0]); // output 

  // 7. d3's line generator
  var line = d3.line()
      .x(function(d) { return xScale(d.time); }) // set the x values for the line generator
      .y(function(d) { return yScale(d[dataType]); }) // set the y values for the line generator 
      .curve(d3.curveMonotoneX) // apply smoothing to the line

  // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
  // var dataset = d3.range(n).map(function(d) { return {"y": d3.randomUniform(1)() } })

  // 1. Add the SVG to the page and employ #2
  var svg = d3.select("#line-chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.selectAll(".axis").remove();
  
  // 3. Call the x axis in a group tag
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale).ticks(d3.timeMinute.every(5))); // Create an axis component with d3.axisBottom

  // 4. Call the y axis in a group tag
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale).ticks(8, "s")); // Create an axis component with d3.axisLeft

// ******************
  // var update = svg.selectAll(".line")
  //     .data(hostHourData);

  // update
  //     .exit()
  //     .remove();

  // update
  //     .enter()
  //     .append("path")
  //       .classed("line", true)
  //       .attr("d", line);

// ******************
  d3.selectAll(".line").remove();

  // 9. Append the path, bind the data, and call the line generator 
  svg.append("path")
      .datum(hostHourData) // 10. Binds data to the line 
      .attr("class", "line") // Assign a class for styling 
      .attr("d", line); // 11. Calls the line generator 


  

  d3.selectAll(".dot").remove();

  // 12. Appends a circle for each datapoint 
  // svg.selectAll(".dot")
  //     .data(hostHourData)
  svg.selectAll(".dot")
    .data(hostHourData)
    .enter()
    .append("circle") // Uses the enter().append() method
      .attr("class", "dot") // Assign a class for styling
      .attr("cx", function(d) { return xScale(d.time) })
      .attr("cy", function(d) { return yScale(d[dataType]) })
      .attr("r", 3);

  d3.selectAll(".axis-label").remove();

  svg.append("text")      // text label for the x-axis
      .attr("x", width + margin.right)
      .attr("y",  height + 2 * margin.bottom / 3)
      .attr("class", "axis-label")
      .style("text-anchor", "end")
      .text("Time");

  svg.append("text")      // text label for the y-axis
      .attr("x", 0)
      .attr("y",  0 - margin.top / 2)
      .attr("class", "axis-label")
      // .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .text(dataType + " / " + units);

  document
    .getElementById("linechart-title")
    .innerHTML 
    = formatDataType(dataType) + " from UCAR to " + host.toUpperCase() + " within the last 1 h";
  //***************************************
//   var linechart = d3.select("#line-chart");
//   var padding = {
//     top: 30,
//     right: 30,
//     bottom: 30,
//     left: 110
//   };
//   var width = +linechart.attr("width");
//   var height = +linechart.attr("height");

//   console.log(data);
//   // console.log(linechart);

//   var hostData = data.filter(d => d.hostname === host);

//   var currTime = new Date("2018-10-01T12:08:00.000Z");
//   var oneHoursAgo = d3.time.hour.offset(currTime, -1);

//   var hostHourData = [];
//   for (var i = 0; i < 60; i++) {
//     var d = d3.time.minute.offset(oneHoursAgo, i);
//     hostHourData.push({"time": d});
//     // console.log(d.getTime());
//   }
//   // console.log(hostHourData);
  
//   hostHourData.map(function (row) {
//     var minuteData = hostData.find(function (item) {
//       return row.time.getTime() === new Date(item.time).getTime();
//     });

//     if (minuteData) {
//       // console.log("success");
//       row.throughput = minuteData.throughput;
//       row.ffdrSize = minuteData.ffdrSize;
//       row.ffdrProd = minuteData.ffdrProd;
//     } else {
//       // console.log("fail");
//       row.throughput = 0;
//       row.ffdrSize = 0;
//       row.ffdrProd = 0;
//     }
//     return row;
//   });
//   console.log(hostHourData);

//   console.log("** line 75: data within 1 hour is available **")
}

// ################### 
// ### https://bl.ocks.org/pstuffa/26363646c478b2028d36e7274cedefa6
// ################### 

// }