d3.queue()
  .defer(d3.csv, "latlng.csv")
  .defer(d3.json, "us-states.json")
  .defer(d3.json, "/hourStat")
  .await(function(error, hosts, mapData, data) {
    if (error) throw error;

    if (data === null || data.length === 0) {
      data = [];
    }
    
    var currFeedType = d3.select("#feedtype").node().value;
    var currentDataType = d3.select('input[name="data-type"]:checked')
                            .attr("value");
    var geoData = topojson.feature(mapData, mapData.objects.states).features

    var width = +d3.select(".chart-container")
              .node().offsetWidth;
    var height = 350;

    createMap(width, width * 3 / 5);
    createLine(width, height);
    drawMap(geoData, hosts, data, currFeedType, currentDataType);

    d3.select("#feedtype")
        .on("change", () => {
          var currFeedType = d3.select("#feedtype").node().value;
          var active = d3.select(".activeHost").data()[0];
          var host = active ? active.name : "";
          drawMap(geoData, hosts, data, currFeedType, currentDataType);
          if (host !== "") {
            drawLine(data, currFeedType, host, currentDataType);
          }
        });

    d3.selectAll('input[name="data-type"]')
        .on("change", () => {
          var active = d3.select(".activeHost").data()[0];
          var host = active ? active.name : "";
          currentDataType = d3.event.target.value;
          drawMap(geoData, hosts, data, currFeedType, currentDataType);
          if (host !== "") {
	    drawLine(data, currFeedType, host, currentDataType);
	  }
        });
    
    var inter = setInterval(function() {
      // console.log("updated");
      var time = new Date();
      console.log(time.getHours() + ":" + time.getMinutes() + ":" + time.getMinutes());
      updateData();
    }, 2 * 60 * 1000);
      
    function updateData() {
      d3.json("/hourStat?feedtype=NGRID", function(error, data) {
        // Scale the range of the data again 
        console.log("Map refreshed");
        var active = d3.select(".activeHost").data()[0];
        var host = active ? active.name : "";
        drawMap(geoData, hosts, data, currFeedType, currentDataType);
        drawLine(data, currFeedType, host, currentDataType);
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
      var isDot = tgt.classed("dot");
      var dataType = d3.select("input:checked")
                       .property("value");
      var hostName = d3.selectAll(".link");
      var units = dataType === "throughput" ? "bps" : "%";
      tooltip
          .style("opacity", +(isLink || isNode || isDot))
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
          var thruValue = data.throughput ?
                          d3.format(".3s")(+data.throughput) + " " + "bps" :
                          "Data Not Available";
          var ffdrSizeValue = data.ffdrSize ?
                          data.ffdrSize.toLocaleString() + " " + "%" :
                          "Data Not Available";
          var ffdrProdValue = data.ffdrProd ?
                          data.ffdrProd.toLocaleString() + " " + "%" :
                          "Data Not Available";
          tooltip.html(
                    ` <p>UCAR to ${hostName.toUpperCase()}</p>
                      <p>Throughput: ${thruValue}</p>
                      <p>FFDR of Size: ${ffdrSizeValue}</p>
                      <p>FFDR of Product: ${ffdrProdValue}</p>
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

currDateDisplay();

function currDateDisplay() {
  var currDate = new Date();
  document.getElementById("currDate").innerHTML = "of one hour transmission until " + formatDate(currDate);  
}


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
  if (hostData["ffdrSize"] != 0) return "Active Receiving";
  else return "Corrupted Receiving";
  console.log(hostData);
}

function custom() {
  var dataType = d3.select("input:checked")
                       .property("value");
  // console.log(dataType);
  var active = d3.select(".activeHost").data()[0];
          // console.log("active:" + active.name);
          var host = active ? active.name : "";
  // console.log(host);
  var url = "./NGRID/" + host.toLocaleString() + "/" + dataType + "/";
  window.location.href = url;
}


