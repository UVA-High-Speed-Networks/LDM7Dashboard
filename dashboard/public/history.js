var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

var parseDate = d3.timeParse("%b %Y");

var xScale = d3.scaleTime().range([0, width]),
    yScale = d3.scaleLinear().range([height, 0]).nice();

var xAxis = d3.axisBottom(xScale),
    yAxis = d3.axisLeft(yScale).ticks(10, "s");

var zoom = d3.zoom()
    .scaleExtent([1, 32])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed)
    .on("end", update);

var drawArea = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return xScale(new Date(d.time)); })
    .y0(height)
    .y1(function(d) { return yScale(+d.data); });

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var dataURL = "/hostData?hostname=uva&feedtype=NGRID&datatype=throughput&startTime=2019-01-08T08:00:00.000Z&endTime=2019-01-08T15:00:00.000Z";

d3.json(dataURL, function(error, data) {
  if (error) throw error;

  console.log(data);

  xScale.domain(d3.extent(data, function(d) { return new Date(d.time); }));
  yScale.domain([0, d3.max(data, function(d) { return +d.data; })]);

  var area = g.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", drawArea);

  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  g.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);

  var d0 = new Date("2019-01-08T08:00:00.000Z"),
      d1 = new Date("2019-01-08T14:00:00.000Z");

  // Gratuitous intro zoom!
  svg.call(zoom).transition()
      .duration(1500)
      .call(zoom.transform, d3.zoomIdentity
          .scale(width / (xScale(d1) - xScale(d0)))
          .translate(-xScale(d0), 0));
});

function zoomed() {
  var t = d3.event.transform, xtScale = t.rescaleX(xScale);
  g.select(".area").attr("d", drawArea.x(function(d) { return xtScale(new Date(d.time)); }));
  g.select(".axis--x").call(xAxis.scale(xtScale));
}

function update() {
  var startTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[0].toISOString();
  var endTime = d3.extent(xAxis.scale().ticks(xAxis.ticks()[0]))[1].toISOString();

  var updateURL = "/hostData?hostname=uva&feedtype=NGRID&datatype=throughput&startTime=" + startTime + "&endTime=" + endTime;

  d3.json(updateURL, function(error, data) {
    if(error) throw error;
    xScale.domain(d3.extent(data, function(d) { return new Date(d.time); }));
    yScale.domain([0, d3.max(data, function(d) { return +d.data; })]);

    d3.selectAll(".area").remove();

    g.append("path")
      .datum(data)
      .attr("class", "area")
      .attr("d", drawArea);
    
    

    });
        
}

function type(d) {
  d.date = parseDate(d.date);
  d.price = +d.price;
  return d;
}