d3.queue()
  .defer(d3.csv, "latlng.csv")
  .defer(d3.json, "us-states.json")
  .defer(d3.json, "/hourStat")
  .await(function(error, hosts, mapData, data) {
    if (error) throw error;

    if (data === null || data.length === 0) {
      data = [];
    }
    
    console.log(data);
    
    var currFeedType = d3.select("#feedtype").node().value;
    // var currDataType = d3.select('input[name="data-type"]:checked')
    //                         .attr("value");
    var currDataType = d3.select("#datatype").node().value;
    // setDatatypeTooltip(currDataType);

    var geoData = topojson.feature(mapData, mapData.objects.states).features

    var width = +d3.select(".chart-container")
              .node().offsetWidth;
    var height = 350;

    createMap(width, width * 3 / 5);
    // createLine(width, height);
    createBar(width, height);
    drawMap(geoData, hosts, data, currFeedType, currDataType);

    d3.select("#feedtype")
        .on("change", () => {
          currFeedType = d3.select("#feedtype").node().value;
          var active = d3.select(".activeHost").data()[0];
          var host = active ? active.name : "";
          drawMap(geoData, hosts, data, currFeedType, currDataType);
          if (host !== "") {
            // drawLine(data, currFeedType, host, currDataType);
            drawBar(data, currFeedType, host, currDataType);
          }
        });

    // d3.selectAll('input[name="data-type"]')
    d3.select("#datatype")
        .on("change", () => {
          // currDataType = d3.event.target.value;
          currDataType = d3.select("#datatype").node().value;
          // setDatatypeTooltip(currDataType);
          var active = d3.select(".activeHost").data()[0];
          var host = active ? active.name : "";
          drawMap(geoData, hosts, data, currFeedType, currDataType);
          if (host !== "") {
            // drawLine(data, currFeedType, host, currDataType);
            drawBar(data, currFeedType, host, currDataType);
          }
        });
    
    var inter = setInterval(function() {
      // console.log("updated");
      var time = new Date();
      console.log(time.getHours() + ":" + time.getMinutes() + ":" + time.getMinutes());
      updateData();
    }, 2 * 60 * 1000);
      
    function updateData() {
      d3.json("/hourStat", function(error, data) {
        // Scale the range of the data again 
        console.log("Map refreshed");
        var active = d3.select(".activeHost").data()[0];
        var host = active ? active.name : "";
        drawMap(geoData, hosts, data, currFeedType, currDataType);
        // drawLine(data, currFeedType, host, currDataType);
        if (host != "") {
          drawBar(data, currFeedType, host, currDataType);
        }
      });
    }

    // tooltip update on mouse move
    d3.selectAll("svg")
        .on("mousemove touchmove", updateTooltip);

    // tooltip update
    function updateTooltip() {
      var tooltip = d3.select(".dataTooltip");
      var tgt = d3.select(d3.event.target);
      var isLink = tgt.classed("link");
      var isNode = tgt.classed("node");
      var isBar = tgt.classed("bar");
      // var isDatatype = tgt.node().id === "datatype";
      // console.log(isDatatype);
      // var isDot = tgt.classed("dot");
      // var dataType = d3.select("input:checked")
      //                  .property("value");
      var hostName = d3.selectAll(".link");
      var units = "";
      // if (currDataType === "aggregatedDelay") {
      //   units = "s";
      // } 
      if (currDataType === "ffdrProd" || currDataType === "ffdrSize") {
        units = "%";
      } 
      // if (currDataType === "maxLatencyThru" || currDataType === "percentile80Thru") {
      //   units = "bps";
      // } 
      else {
        units = "bps";
      }
      
      tooltip
          .style("opacity", +(isLink || isNode || isBar))
          .style("left", (d3.event.pageX - tooltip.node().offsetWidth / 2 - 20) + "px")
          .style("top", (d3.event.pageY - tooltip.node().offsetHeight - 25) + "px");

      if (isNode) {
        var data = tgt.data()[0];
        if (data) {
          var hostName = data["name"] ? data["name"].toLocaleString() : "";
          tooltip.html(
                    ` <p>Name: ${hostName.toUpperCase()}</p>
                      <p>${hostStatus(data)}</p>
                    `)
        }
      }
      if (isLink) {
        var data = tgt.data()[0];
        if (data) {
          var hostName = data["name"] ? data["name"].toLocaleString() : "";
          // var thrus = ["avgThru", "minThru", "maxLatencyThru", "percentile80Thru"];
          // var ffdrs = ["ffdrSize", "ffdrProd"];
          // var thruValue = function(thru) { 
          //   return data[thru] ? d3.format(".3s")(+data[thru]) + " " + "bps" : "Data Not Available";
          // };
          var avgThruValue = data.avgThru ?
                          d3.format(".3s")(+data.avgThru) + " " + "bps" :
                          "Data Not Available";
          var minThruValue = data.minThru ?
                          d3.format(".3s")(+data.minThru) + " " + "bps" :
                          "Data Not Available";
          var maxLatencyThruValue = data.maxLatencyThru ?
                          d3.format(".3s")(+data.maxLatencyThru) + " " + "bps" :
                          "Data Not Available";
          var percentileThruValue = data.percentile80Thru ?
                          d3.format(".3s")(+data.percentile80Thru) + " " + "bps" :
                          "Data Not Available";
          var ffdrSizeValue = data.ffdrSize ?
                          data.ffdrSize.toLocaleString() + " " + "%" :
                          "Data Not Available";
          var ffdrProdValue = data.ffdrProd ?
                          data.ffdrProd.toLocaleString() + " " + "%" :
                          "Data Not Available";
          tooltip.html(
                    ` <p>UCAR to ${hostName.toUpperCase()}</p>
                      <p>Average Throughput: ${avgThruValue}</p>
                      <p>Minimum Throughput: ${minThruValue}</p>
                      <p>Throughput with max Latency: ${maxLatencyThruValue}</p>
                      <p>Throughput of 80th percentile: ${percentileThruValue}</p>
                      <p>FFDR of Size: ${ffdrSizeValue}</p>
                      <p>FFDR of Product: ${ffdrProdValue}</p>
                      <p>Ratio of Negative Latency: ${data.negativeLatencyRatio} %</p>
                    `)
        }
      }
      if (isBar) {
        var data = tgt.data()[0];
        // if (data) {
        //   // var hostName = data["name"] ? data["name"].toLocaleString() : "";
        //   var dataValue = data[currDataType] ?
        //                   data[currDataType].toLocaleString() + " " + units :
        //                   "Data Not Available";
        //   tooltip.html(
        //             ` <p>Time: ${formatDate(data["time"])}</p>
        //               <p>${formatDataType(currDataType)}: ${dataValue}</p>
        //             `)
        // }
        if (data) {
          var hostName = data["name"] ? data["name"].toLocaleString() : "";
          var avgThruValue = data.avgThru ?
                          d3.format(".3s")(+data.avgThru) + " " + "bps" :
                          "Data Not Available";
          var minThruValue = data.minThru ?
                          d3.format(".3s")(+data.minThru) + " " + "bps" :
                          "Data Not Available";
          var maxLatencyThruValue = data.maxLatencyThru ?
                          d3.format(".3s")(+data.maxLatencyThru) + " " + "bps" :
                          "Data Not Available";
          var percentileThruValue = data.percentile80Thru ?
                          d3.format(".3s")(+data.percentile80Thru) + " " + "bps" :
                          "Data Not Available";
          var ffdrSizeValue = data.ffdrSize ?
                          data.ffdrSize.toLocaleString() + " " + "%" :
                          "Data Not Available";
          var ffdrProdValue = data.ffdrProd ?
                          data.ffdrProd.toLocaleString() + " " + "%" :
                          "Data Not Available";
          tooltip.html(
                    ` <p>Time: ${formatDate(data["time"])}</p>
                      <p>Average Throughput: ${avgThruValue}</p>
                      <p>Minimum Throughput: ${minThruValue}</p>
                      <p>Throughput with max Latency: ${maxLatencyThruValue}</p>
                      <p>Throughput of 80th percentile: ${percentileThruValue}</p>
                      <p>FFDR of Size: ${ffdrSizeValue}</p>
                      <p>FFDR of Product: ${ffdrProdValue}</p>
                      <p>Ratio of Negative Latency: ${data.negativeLatencyRatio} %</p>
                    `)
        }
      }
    }
  });

currDateDisplay();

function currDateDisplay() {
  var currDate = new Date();
  document.getElementById("currDate").innerHTML = "for last one hour " ;
  // + formatDate(currDate);  
}


function formatDate(date) {
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  // return date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear() + ' - ' ;
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

function hostStatus(hostData) {
  if (hostData["name"] == "ucar") return "Sending Host";
  else return "Receiving Host";
}

function custom() {
  // console.log(dataType);
  var active = d3.select(".activeHost").data()[0];
  // console.log("active:" + active.name);
  var host = active ? active.name : "";
  // console.log(host);
  var feedtype = d3.select("#feedtype").node().value;
  var dataType = d3.select("#datatype").node().value;
  var url = "./" + feedtype + "/" + host.toLocaleString() + "/" + dataType + "/";
  window.location.href = url;
}

// function setDatatypeTooltip(datatype) {
//   var txt = "";
//   switch (datatype) {
//     case "ffdrProd": { txt = "FFDR of Product"; break; }
//     case "ffdrSize": { txt = "FFDR of Size"; break; }
//     case "avgThru": { txt = "Average Throughput"; break; }
//     case "minThru": { txt = "Minimum Throughput"; break; }
//     case "maxLatencyThru": { txt = "Throughput with Max Latency"; break; }
//     case "percentile80Thru": { txt = "Throughput of 80th percentile"; break; }
//   }
//   // document.getElementById("datatype").setAttribute("title", txt);
//   $('#datatype').tooltip('options', 'title', txt);
// }

// var txt = "Average Throughput: sum of received product size within 1h / sum of latency within 1h";
// document.getElementById("datatype").setAttribute("title", txt);
$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();   
});