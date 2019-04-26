
const currURL = window.location.href;
const currURLsize = currURL.split('/').length;
const feedtype = currURL.split('/')[currURLsize-4];
const hostname = currURL.split('/')[currURLsize-3];
const datatype = currURL.split('/')[currURLsize-2];

var initEndTime = new Date();
var initStartTime = d3.time.hour.offset(initEndTime, -3);
var dataURL = "/hostData?hostname="+hostname+"&feedtype="+feedtype+"&datatype="+datatype+"&startTime="+initStartTime+"&endTime="+initEndTime;
// var dataURL = "/hostData?hostname=uva&feedtype=NGRID&datatype=throughput";
d3.json(dataURL, function(data) {
    const dateExtent = [data.earliest, data.latest];
    drawScalable(data.data, dateExtent);
});

function drawScalable(data, dateExtent) {

    var zoom = d3.zoom()
                // .scaleExtent(extent)
                // .scaleExtent([1, 32])
                // .translateExtent([[0, 0], [width, height]])
                // .extent([[0, 0], [width, height]])
                // .on('start', )
                .on('zoom', zoomed)
                .on('end', update);

    var chart = d3.select("#scalable-chart");

    var padding = {top: 60, right: 60, bottom: 60, left: 60},
    width = 1000 - padding.left - padding.right,
    height = 400 - padding.top - padding.bottom;

    // Linear Scales
    var xScale = d3.time.scale()
        .domain(d3.extent(data, function(d) { // input
            return new Date(d.time);
        }))
        // .domain([startTime, endTime])
        .range([0, width]); // view
        // .nice();
   
    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.data)])
        .range([height, 0]);
        // .nice();

    var xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(12);
        // .ticks(d3.timeMinute.every(15));
    
    var yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(8, "s");

    chart.append("text")      
        .attr("x", width + padding.left + padding.right/2)
        .attr("y",  height + padding.top + 2 * padding.bottom / 3)
        .attr("class", "x-axis-label")
        .style("text-anchor", "end")
        .text("Time");
    
    var units = datatype === "throughput" ? "bps" : "%";
      
    // text label for the y-axis
    chart.append("text")
        .attr("x", padding.left)
        .attr("y",  padding.top / 2)
        .attr("class", "y-axis-label")
        .style("text-anchor", "middle")
        .text(units);

    var plotLine = d3.line()
        // .curve(d3.curveMonotoneX)
        .x(function(d) { return xScale(new Date(d.time));})
        .y(function(d) { return yScale(d.data);});

    chart.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + padding.left + "," + (height+padding.top) + ")")
        .call(xAxis);

    chart.append("g")
        .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
        .attr("class", "y axis")
        .call(yAxis);
    
    // d3.selectAll(".line").remove();

    var line = chart.append("g").append("path")
                    .attr("clip-path", "url(#clip)")
                    .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
                    .data([data])
                    .classed("line", true)
                    .attr("d", plotLine)
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", "2")
                    .attr("fill", "none");

    chart.call(zoom);

    /****************** Zoom Function ********************************/
    function zoomed() {
        // Update x Scale
        let new_xScale = d3.event.transform.rescaleX(xScale);

        chart.select(".x.axis").transition()
            .duration(50)
            .call(xAxis.scale(new_xScale));

        // re-draw line
        plotLine = d3.line()
            // .curve(d3.curveMonotoneX)
            .x(function (d) {
                return new_xScale(new Date(d.time));
            })
            .y(function (d) {
                return yScale(d.data); 
            });

        line.attr("d", plotLine);

    }

    /****************** Update After Zoom *******************************/

    function update() {
        var startTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[0].toISOString();
        var endTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[1].toISOString();

        updateCustom(startTime, endTime);
        updateData(startTime, endTime);
    }

    /****************** Periodically Update Below **************************/

    // Data Update
    var inter = setInterval(function() {
      var time = new Date();
      console.log("Updated: " + time.getHours() + ":" + time.getMinutes() + ":" + time.getMinutes());

      var startTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[0].toISOString();
      var endTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[1].toISOString();
      if (time.getTime() - new Date(endTime).getTime() < 5 * 60 * 1000) {
          endTime = time.toLocaleString();
      }
      updateData(startTime, endTime);
    }, 0.5 * 60 * 1000);


    d3.selectAll('.choices')
        .on("click", () => {
            var range = d3.event.target.id;
            endTime = new Date();

            if (range === "30min") {
                var startTime = d3.time.minute.offset(endTime, -30);
            } else if (range === "1h") {
                var startTime = d3.time.hour.offset(endTime, -1);
            } else if (range === "6h") {
                var startTime = d3.time.hour.offset(endTime, -6);
            } else if (range === "1d") {
                var startTime = d3.time.day.offset(endTime, -1);
            } else if (range === "1w") {
                var startTime = d3.time.day.offset(endTime, -7);
            } else if (range === "1mon") {
                var startTime = d3.time.month.offset(endTime, -1);
            } else if (range === "3mon") {
                var startTime = d3.time.month.offset(endTime, -3);
            } else if (range === "custom") {
                document.getElementById("customTable").hidden = !document.getElementById("customTable").hidden;
            } else {
                var startTime = d3.time.hour.offset(endTime, -6);
            }
            updateData(startTime, endTime);
        });

    d3.select('#enter').on("click", () => {
        if (document.getElementById("startDate").value) {
            var startTime = new Date(document.getElementById("startDate").value).toISOString();
            if (document.getElementById("endDate").value) {
                var endTime = new Date(document.getElementById("endDate").value).toISOString();
                if (startTime > dateExtent[1] || endTime < dateExtent[0]) {
                    alert("Data Availbale from " + dateExtent[0].substr(0,10) + " to " + dateExtent[1].substr(0,10));
                    startTime = endTime = null;
                } else {
                    if (startTime < dateExtent[0]) {
                        d3.select('#startWarning').node().innerHTML = "The earliest data available on ";
                        startTime = dateExtent[0];
                    } else {
                        d3.select('#startWarning').node().innerHTML = "";
                    }
                    if (endTime > dateExtent[1]) {
                        d3.select('#endWarning').node().innerHTML = "The latest data available on ";
                        endTime = dateExtent[1];
                    } else {
                        d3.select('#endWarning').node().innerHTML = "";
                    }
                }
            } else {
                alert("Input End Date");
            }
        } else {
            alert("Input Start Date");
        }
        
        if (startTime && endTime) {
            updateData(startTime, endTime);
        }
    });

    d3.select('#hide').on("click", () => {
        document.getElementById("customTable").hidden = true;
    });

    function updateData(startTime, endTime) {
        var updateURL = "/hostData?hostname="+hostname+"&feedtype="+feedtype+"&datatype="+datatype+"&startTime="+startTime+"&endTime="+endTime;
        d3.json(updateURL, function(rowData) {

        const dateExtent = [data.earliest, data.latest];

            // re-draw line
            data = rowData.data;

            xScale = d3.time.scale()
                .domain(d3.extent(data, function(d) { // input
                    return new Date(d.time);
                }))
                .range([0, width]); // view
                // .nice();

            yScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.data)])
                .range([height, 0]);
                // .nice();

            chart.select(".x.axis")
                .transition()
                    .duration(800)
                // .call(xAxis.scale(new_xScale));
                .call(xAxis.scale(xScale));

            chart.select(".y.axis")
                .transition()
                    .duration(800)
                // .call(yAxis.scale(new_yScale));
                .call(yAxis.scale(yScale));
    
            plotLine = d3.line()
                // .curve(d3.curveMonotoneX)
                .x(function (d) { 
                    return xScale(new Date(d.time));})
                .y(function (d) { return yScale(d.data); });
            

            line.datum(data)
                .attr("d", plotLine);

            chart.call(zoom);

            if ((d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[0])) {
                var st = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[0].toISOString();
            }
            // var startTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[0].toISOString();
            if ((d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[1])) {
                var et = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[1].toISOString();
            }
            // var endTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[1].toISOString();
            if (st && et) {
                updateCustom(st, et);
            }
        });
    }
}

// update the title
document
    .getElementById("title")
    .innerHTML 
    = formatDataType(datatype)
    +" of " + feedtype.toUpperCase()
    + " from UCAR to " + hostname.toUpperCase();

function updateCustom(startTime, endTime) {
    var sd = startTime.substr(0, 10);
    var st = startTime.substr(11, 8);
    var ed = endTime.substr(0, 10);
    var et = endTime.substr(11, 8);
    d3.select('#startDate').property('value', sd);
    d3.select('#startTime').property('value', st);
    d3.select('#endDate').property('value', ed);
    d3.select('#endTime').property('value', et);
}

function formatDataType(key) {
    switch (key) {
      case "ffdrProd": return  "FFDR of Product";
      case "ffdrSize": return "FFDR of Size";
      case "avgThru": return "Average Throughput";
      case "minThru": return "Minimum Throughput";
      case "maxLatencyThru": return "Throughput with Max Latency";
      case "percentile80Thru": return "Throughput of 80th percentile";
      case "negativeLatencyNum": return "Number of Negative Latency";
    }
  }
