
const currURL = window.location.href;
const currURLsize = currURL.split('/').length;
const feedtype = currURL.split('/')[currURLsize-4];
const hostname = currURL.split('/')[currURLsize-3];
const datatype = currURL.split('/')[currURLsize-2];

var initEndTime = new Date();
var initStartTime = d3.time.hour.offset(initEndTime, -3);
var dataURL = "/hostData?hostname="+hostname+"&feedtype=NGRID&datatype="+datatype+"&startTime="+initStartTime+"&endTime="+initEndTime;
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

        var updateURL = "/hostData?hostname="+hostname+"&feedtype=NGRID&datatype="+datatype+"&startTime="+startTime+"&endTime="+endTime;
        d3.json(updateURL, function(rowData) {
            const dateExtent = [data.earliest, data.latest];

            // re-draw line
            data = rowData.data;
            // console.log(data);
            // console.log(new Date(data[0].time));
            // console.log(d3.extent(data, d => new Date(d.time)));
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
                // .y(function (d) { return new_yScale(d.data); });
                .y(function (d) { return yScale(d.data); });
            
            line.datum(data)
                .attr("d", plotLine);

            chart.call(zoom);
        });
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
            } else if (range === "1m") {
                var startTime = d3.time.month.offset(endTime, -1);
            } else if (range === "3m") {
                var startTime = d3.time.month.offset(endTime, -3);
            } else {
                var startTime = d3.time.hour.offset(endTime, -6);
            }

            updateData(startTime, endTime);
        });

    function updateData(startTime, endTime) {
        var updateURL = "/hostData?hostname="+hostname+"&feedtype=NGRID&datatype="+datatype+"&startTime="+startTime+"&endTime="+endTime;
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
        });
    }
}

// update the title
document
    .getElementById("title")
    .innerHTML 
    = formatDataType(datatype)
    + " from UCAR to " + hostname.toUpperCase();


function formatDataType(key) {
    if (key === "ffdrProd") {
      return "FFDR of Product";
    } else if (key === "ffdrSize") {
      return "FFDR of Size";
    } else {
      return key[0].toUpperCase() + key.slice(1).replace(/[A-Z]/g, c => " " + c);
    }
}
