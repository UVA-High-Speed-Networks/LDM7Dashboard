
const currURL = window.location.href;
const currURLsize = currURL.split('/').length;
const feedtype = currURL.split('/')[currURLsize-4];
const hostname = currURL.split('/')[currURLsize-3];
const datatype = currURL.split('/')[currURLsize-2];
console.log(datatype);

var dataURL = "/hostData?hostname="+hostname+"&feedtype=NGRID&datatype="+datatype+"&startTime=2019-01-08T12:00:00.000Z&endTime=2019-01-08T15:00:00.000Z";
// var dataURL = "/hostData?hostname=uva&feedtype=NGRID&datatype=throughput";
d3.json(dataURL, function(data) {
    console.log(data);
    const dateExtent = [data.earliest, data.latest];
    console.log(dateExtent);
    drawScalable(data.data, dateExtent);
});

function drawScalable(data, dateExtent) {
    // var ms = new Date(dateExtent[1]).getTime() - new Date(dateExtent[0]).getTime();
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

    // var startTime = new Date("2019-01-08T09:00:00.000Z");
    // var endTime = new Date("2019-01-08T14:00:00.000Z");
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
        // let new_yScale = d3.event.transform.rescaleY(yScale);

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
                // return new_yScale(d.data);
            });

        line.attr("d", plotLine);

        // xScale = new_xScale;
    }

    /****************** Update Data Below *******************************/
    // d3.select("#update").on('click', update);

    function update() {
        var startTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[0].toISOString();
        var endTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[1].toISOString();
        // var startTime = d3.extent(xAxis.scale())[0].toISOString();
        // var endTime = d3.extent(xAxis.scale())[1].toISOString();
        console.log(startTime, endTime);
        // console.log(d3.extent(xAxis.scale()[0]));
        var updateURL = "/hostData?hostname="+hostname+"&feedtype=NGRID&datatype="+datatype+"&startTime="+startTime+"&endTime="+endTime;
        d3.json(updateURL, function(rowData) {
            const dateExtent = [data.earliest, data.latest];
            console.log(dateExtent);

            // re-draw line
            data = rowData.data;
            console.log(data);
            console.log(new Date(data[0].time));
            console.log(d3.extent(data, d => new Date(d.time)));
            // let new_xScale = d3.time.scale()
            //     .domain(d3.extent(data, function(d) { // input
            //         return new Date(d.time);
            //     }))
            //     .range([0, width]) // view
            //     .nice();
            xScale = d3.time.scale()
                .domain(d3.extent(data, function(d) { // input
                    return new Date(d.time);
                }))
                .range([0, width]); // view
                // .nice();

            // console.log(new_xScale(new Date("2019-01-08T04:00:00.000Z")));
            // console.log(new_xScale(new Date("2019-01-08T03:00:00.000Z")));
            console.log(xScale(new Date("2019-01-08T04:00:00.000Z")));
            
            // let new_yScale = d3.scaleLinear()
            //     .domain([0, d3.max(data, d => d.data)])
            //     .range([height, 0])
            //     .nice();
            yScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.data)])
                .range([height, 0]);
                // .nice();

            // xAxis.scale(xScale);
            // yAxis.scale(yScale);

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
                    // console.log(new Date(d.time));
                    // console.log(xScale(new Date(d.time)));
                    // return new_xScale(new Date(d.time));})
                    return xScale(new Date(d.time));})
                // .y(function (d) { return new_yScale(d.data); });
                .y(function (d) { return yScale(d.data); });
            
            // chart.call(xAxis)
            //     .call(yAxis);

            line.datum(data)
                .attr("d", plotLine);

            // xScale = new_xScale;
            // yScale = new_yScale;

            chart.call(zoom);
        });
        // data = randomData(50);

        // xScale.domain(d3.extent(data, function(d) {
        // return new Date(d.time);
        // })).nice();
        
        // yScale.domain(d3.extent(data, function(d) {
        // return d.data;
        // })).nice();

        // line.datum(data)
        // .transition().duration(750)
        // .attr("d", plotLine)
        // .style("fill", "none")
        // .style("stroke-width", "2px")
        // .style("stroke", "brown");
    }

    /****************** Periodically Update Below **************************/

    // // Data Update
    // var inter = setInterval(function() {
    //   // updateData();
    //   console.log("updated");
    //   var time = new Date();
    //   console.log(time.getHours() + ":" + time.getMinutes() + ":" + time.getMinutes());
    //   updateData();
    //   // updateMap();
    // }, 5 * 60 * 1000);
      
    // function updateData() {
    //   d3.json("/hourStat?hostname=uva&feedtype=NGRID", function(error, data) {
    //     // Scale the range of the data again 
    //     drawMap(geoData, hosts, data, currentDataType);
    //     console.log("Map refreshed");
    //     var active = d3.select(".activeHost").data()[0];
    //     var host = active ? active.name : "";
    //     drawLine(data, host, currentDataType);
    //   });
    // }
// }


    d3.selectAll('.choices')
        .on("click", () => {
            var range = d3.event.target.id;
            console.log(range);
            reset(range);
        });

    function reset(range) {
        // chart.transition()
        //     .duration(750);
            // .call(zoom.transform, d3.zoomIdentity);

        var endTime = new Date("2019-01-08T14:06:00.000Z");
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

        console.log(startTime, endTime);
        var updateURL = "/hostData?hostname="+hostname+"&feedtype=NGRID&datatype="+datatype+"&startTime="+startTime+"&endTime="+endTime;
        d3.json(updateURL, function(rowData) {
        //     const dateExtent = [data.earliest, data.latest];
        //     console.log(dateExtent);

        //     d3.select(".line").remove();
        //     d3.select(".x.axis").remove();
        //     d3.select(".y.axis").remove();
        //     drawScalable(data.data, dateExtent);
        // });
        const dateExtent = [data.earliest, data.latest];
            console.log(dateExtent);

            // re-draw line
            data = rowData.data;
            console.log(data);
            console.log(new Date(data[0].time));
            console.log(d3.extent(data, d => new Date(d.time)));
            // let new_xScale = d3.time.scale()
            //     .domain(d3.extent(data, function(d) { // input
            //         return new Date(d.time);
            //     }))
            //     .range([0, width]) // view
            //     .nice();
            xScale = d3.time.scale()
                .domain(d3.extent(data, function(d) { // input
                    return new Date(d.time);
                }))
                .range([0, width]); // view
                // .nice();

            // console.log(new_xScale(new Date("2019-01-08T04:00:00.000Z")));
            // console.log(new_xScale(new Date("2019-01-08T03:00:00.000Z")));
            console.log(xScale(new Date("2019-01-08T04:00:00.000Z")));
            
            // let new_yScale = d3.scaleLinear()
            //     .domain([0, d3.max(data, d => d.data)])
            //     .range([height, 0])
            //     .nice();
            yScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.data)])
                .range([height, 0]);
                // .nice();

            // xAxis.scale(xScale);
            // yAxis.scale(yScale);

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
                    // console.log(new Date(d.time));
                    // console.log(xScale(new Date(d.time)));
                    // return new_xScale(new Date(d.time));})
                    return xScale(new Date(d.time));})
                // .y(function (d) { return new_yScale(d.data); });
                .y(function (d) { return yScale(d.data); });
            
            // chart.call(xAxis)
            //     .call(yAxis);

            line.datum(data)
                .attr("d", plotLine);

            // xScale = new_xScale;
            // yScale = new_yScale;

            chart.call(zoom);
        });
    }
}