d3.queue()
  .defer(d3.csv, "latlng.csv")
  .defer(d3.json, "us-states.json")
  .defer(d3.json, "/hourStat?hostname=uva&feedtype=NGRID")
  .await(function(error, hosts, mapData, data) {
    if (error) throw error;

    // var extremeDates = d3.extent(data, d => d.date);
    // console.log(hosts);
    // console.log(mapData);
    console.log(data[0].time);
    console.log(new Date(data[0].time).getTime());

    var currentDataType = d3.select('input[name="data-type"]:checked')
                            .attr("value");
    var geoData = topojson.feature(mapData, mapData.objects.states).features
    // console.log(geoData); 

    var width = +d3.select(".chart-container")
              .node().offsetWidth;
    var height = 350;

    createMap(width, width * 3 / 5);
    createLine(width, height);
    drawMap(geoData, hosts, data, currentDataType);

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
          drawMap(geoData, hosts, data, currentDataType);
          drawLine(data, host, currentDataType);
          // drawTopo();
          // drawBar(data, host, currentDataType, currentDate);
          // drawLine(data, host, "latency", currentDate);
        });
    
    var inter = setInterval(function() {
      // updateData();
      console.log("updated");
      var time = new Date();
      console.log(time.getHours() + ":" + time.getMinutes() + ":" + time.getMinutes());
      updateData();
      // updateMap();
    }, 5 * 60 * 1000);
      
    function updateData() {
      d3.json("/hourStat?hostname=uva&feedtype=NGRID", function(error, data) {
        // Scale the range of the data again 
        drawMap(geoData, hosts, data, currentDataType);
        console.log("Map refreshed");
        var active = d3.select(".activeHost").data()[0];
        var host = active ? active.name : "";
        drawLine(data, host, currentDataType);
      });
    }

    // tooltip update on mouse move
    d3.selectAll("svg")
        .on("mousemove touchmove", updateTooltip);

    // tooltip update
    function updateTooltip() {
      var tooltip = d3.select(".tooltip");
      var tgt = d3.select(d3.event.target);
      var isLink = tgt.classed("link");
      var isNode = tgt.classed("node");
      var isBar = tgt.classed("bar");
      var isDot = tgt.classed("dot");
      var dataType = d3.select("input:checked")
                       .property("value");
      var hostName = d3.selectAll(".link");
      // console.log(hostName);
      var units = dataType === "throughput" ? "bps" : "%";
      // if (isLink) data = tgt.data()[0];
      // if (isArc) {
      //   data = tgt.data()[0].data;
      //   percentage = `<p>Percentage of total: ${getPercentage(tgt.data()[0])}</p>`;
      // }
      // if (isBar) data = tgt.data()[0];
      tooltip
          .style("opacity", +(isLink || isNode || isBar || isDot))
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
      if (isDot) {
        var data = tgt.data()[0];
        if (data) {
          var hostName = data["name"] ? data["name"].toLocaleString() : "";
          var dataValue = data[dataType] ?
                          data[dataType].toLocaleString() + " " + units :
                          "Data Not Available";
          // console.log(dataType);
          tooltip.html(
                    ` <p>Time: ${formatDate(data["time"])}</p>
                      <p>${formatDataType(dataType)}: ${dataValue}</p>
                    `)
        }
      }
    }
  });

function formatDate(date) {
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  // return date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear() + ' - ' ;
}

function formatDataType(key) {
  if (key === "ffdrProd") {
    return "FFDR of Product";
  } else if (key === "ffdrSize") {
    return "FFDR of Size";
  } else {
    return key[0].toUpperCase() + key.slice(1).replace(/[A-Z]/g, c => " " + c);
  }
  
  // var name = key.replace(/[A-Z]/g, c => " " + c);
  // console.log(name);
  // return name
}

function hostStatus(hostData) {
  if (hostData["name"] == "ucar") return "Origin";
  else if (hostData["latency"] != NaN && hostData["products"] != 0) return "Active Receiving";
  else return "Corrupted Receiving";
}

function custom() {
  var dataType = d3.select("input:checked")
                       .property("value");
  console.log(dataType);
  var active = d3.select(".activeHost").data()[0];
          // console.log("active:" + active.name);
          var host = active ? active.name : "";
  console.log(host);
  var url = "./NGRID/" + host.toLocaleString() + "/" + dataType + "/";
  window.location.href = url;
}


