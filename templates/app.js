
d3.queue()
  .defer(d3.csv, "latlng.csv")
  .defer(d3.json, "us-states.json")
  .defer(d3.csv, "data0629.csv", function(row) {
    var ct = timeFormat(row.CreationTime);
    // console.log(row.StateCode);
    return {
      time: ct.time,
      date: row.CreationDate,
      hour: +row.CreationHour,
      host: row.ReceivingHost,
      products: +row.ProductsReceived,
      bytes: +row.BytesReceived,
      latency: +(+row.Latency).toFixed(4),
    }
  })

  .await(function(error, hosts, mapData, data) {
    if (error) throw error;

    // var extremeDates = d3.extent(data, d => d.date);
    // var currentDate = extremeDates[0];
    var currentDate = "0629";

    var currentDataType = d3.select('input[name="data-type"]:checked')
                            .attr("value");
    var geoData = topojson.feature(mapData, mapData.objects.states).features
    // console.log(geoData); 

    var width = +d3.select(".chart-container")
              .node().offsetWidth;
    var height = 350;

    createMap(width, width * 3 / 5);
    createBar(width, height);
    createLine(width, height);
    drawMap(geoData, hosts, data, currentDate, currentDataType);
    // drawPie(data, currentDate);
    // drawBar(data, currentDataType, "");

    // // createProduct(width, height);
    // createBar(width, height);
    // // createLatency(width, height);
    // // drawProduct(data, host, currentDate);
    // drawBar(data, "uva", currentDataType, currentDate);
    // // drawLatency(width, height);

    // d3.select("#date")
    //     .property("value", currentDate)
    //     .on("input", () => {
    //       currentDate = +d3.event.target.value;
    //       drawMap(geoData, data, currentDate, currentDataType);
    //       // drawPie(data, currentDate);
    //       // highlightBars(currentDate);
    //     });

    d3.selectAll('input[name="data-type"]')
        .on("change", () => {
          var active = d3.select(".activeHost").data()[0];
          // console.log("active:" + active.name);
          var host = active ? active.name : "";
          // var currentDate = d3.select('input[name="date"]:checked')
          //                   .attr("value");
          // var host = d3.selectAll('input[name="host-name"]');
          // var link = active ? active.properties.link : "";
          currentDataType = d3.event.target.value;
          console.log(currentDataType);
          drawMap(geoData, hosts, data, currentDate, currentDataType);
          // drawTopo();
          drawBar(data, host, currentDataType, currentDate);
          // drawLine(data, host, "latency", currentDate);
        });
    
    // Currently without clicking on nodes or links
    // d3.selectAll('input[name="host-name"]')
    //     .on("change", () => {
    //       host = d3.event.target.value;
    //       drawBar(data, host, currentDataType, currentDate);
    //     });

    d3.selectAll("svg")
        .on("mousemove touchmove", updateTooltip);

    function updateTooltip() {
      var tooltip = d3.select(".tooltip");
      var tgt = d3.select(d3.event.target);
      var isLink = tgt.classed("link");
      var isBar = tgt.classed("bar");
      var isNode = tgt.classed("node");
      var dataType = d3.select("input:checked")
                       .property("value");
      var hostName = d3.selectAll(".link");
      // console.log(hostName);
      var units = dataType === "throughput" ? "bytes/latency" : "";
      // if (isLink) data = tgt.data()[0];
      // if (isArc) {
      //   data = tgt.data()[0].data;
      //   percentage = `<p>Percentage of total: ${getPercentage(tgt.data()[0])}</p>`;
      // }
      // if (isBar) data = tgt.data()[0];
      tooltip
          .style("opacity", +(isLink || isNode || isBar))
          .style("left", (d3.event.pageX - tooltip.node().offsetWidth / 2 - 20) + "px")
          .style("top", (d3.event.pageY - tooltip.node().offsetHeight - 25) + "px");

      if (isNode) {
        var data = tgt.data()[0];
        if (data) {
          var hostName = data["name"] ? data["name"].toLocaleString() : "";
          tooltip.html(
                    ` <p>Host: ${hostName.toUpperCase()}</p>
                      <p>Status: ${hostStatus(data)}</p>
                    `)
        }
      }
      if (isLink) {
        var data = tgt.data()[0];
        if (data) {
          var hostName = data["name"] ? data["name"].toLocaleString() : "";
          var dataValue = data[dataType] ?
                          data[dataType].toLocaleString() + " " + units :
                          "Data Not Available";
          tooltip.html(
                    ` <p>UCAR to ${hostName.toUpperCase()}</p>
                      <p>${formatDataType(dataType)}: ${dataValue}</p>
                    `)
        }
      }
      if (isBar) {
        var data = tgt.data()[0];
        if (data) {
          var hostName = data["name"] ? data["name"].toLocaleString() : "";
          var dataValue = data[dataType] ?
                          data[dataType].toLocaleString() + " " + units :
                          "Data Not Available";
          // console.log(dataType);
          tooltip.html(
                    ` <p>Hour: ${data["hour"]}</p>
                      <p>${formatDataType(dataType)}: ${dataValue}</p>
                    `)
        }
      }
      // if (data) {
      //   var dataValue = data[dataType] ?
      //     data[dataType].toLocaleString() + " " + units :
      //     "Data Not Available";
      //   tooltip 
      //   .html(
      //         // <p>Host: ${hostName}</p>
      //       `  <p>${formatDataType(dataType)}: ${dataValue}</p>
      //       `)
      //       // .html(`
      //       //   <p>Country: ${data.country}</p>
      //       //   <p>${formatDataType(dataType)}: ${dataValue}</p>
      //       //   <p>Date: ${data.date || d3.select("#date").property("value")}</p>
      //       //   ${percentage}
      //       // `)
      // }
    }
  });

function formatDataType(key) {
  return key[0].toUpperCase() + key.slice(1).replace(/[A-Z]/g, c => " " + c);
}

function hostStatus(hostData) {
  if (hostData["name"] == "ucar") return "Origin";
  else if (hostData["latency"] != NaN && hostData["products"] != 0) return "Active Receiving";
  else return "Corrupted Receiving";
}

function timeFormat(d) {
  var time = "";
  time = time.concat( d.substring(0, 4), "-", 
                      d.substring(4, 6), "-",
                      d.substring(6, 8), "T",
                      d.substring(8, 10), ":",
                      d.substring(10, 12), ":",
                      d.substring(12, 14), "Z");
  return {
    time: new Date(time),
    date: d.substring(4, 6) + "" + d.substring(6, 8)
  }
}















