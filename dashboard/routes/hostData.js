var express = require('express');
var router = express.Router();
var Mins = require('../models/mins');

router.get("/", function(req, res){
  var hostname = req.query.hostname;
  var feedtype = req.query.feedtype;
  var datatype = req.query.datatype;
  var startTime = new Date(req.query.startTime);
  var endTime = new Date(req.query.endTime);

  // console.log(startTime);
  // var hostname = "uva";
  // var feedtype = "NGRID";
  // var datatype = "throughput";
  // var startTime = "2019-01-08T12:00:00.000Z";
  // var endTime = "2019-01-08T14:00:00.000Z";

  if (datatype == "avgThru") {
    var dataReq = ["receivedSize", "aggregatedLatency"];
  } else if (datatype == "minThru") {
    var dataReq = ["minThruSize", "minThruLatency"];
  } else if (datatype == "maxLatencyThru") {
    var dataReq = ["maxLatencyThruSize", "maxLatency"];
  } else if (datatype == "ffdrSize") {
    var dataReq = ["receivedSize", "completeSize"];
  } else if (datatype == "ffdrProd") {
    var dataReq = ["receivedProd", "completeProd"];
  } else {
    // console.log("DataType not available");
  }

  Promise.all([
    Mins.findOne({ // earliest
      feedtype: feedtype, 
      hostname: hostname
    }).sort({date: 1}),
    Mins.findOne({ // latest
      feedtype: feedtype, 
      hostname: hostname
    }).sort({date: -1}),
    Mins.find({
      feedtype: feedtype, 
      hostname: hostname,
      date: { 
        $gte: startTime,
        $lte: endTime
      }})
    ]).then( ([ earliest, latest, allData]) => {
      // console.log("hostData.js triggered");
      // console.log(earliest);
      // console.log(endTime);
      if ((endTime.getTime() - startTime.getTime()) < (1000*60*60*8)) {
        var hostData = [];
        for (var i = 0; i < allData.length; i++) {
          var line = {
            time: allData[i].date,
            data: allData[i][datatype]
          }
          hostData.push(line);
        }
        // console.log(hostData.length);
        // res.send(dataArr);
      } else {
        var dataArr = [];
        for (var i = 0; i < allData.length; i++) {
          // parse
          var hourTime = allData[i].date;
          hourTime.setMinutes(0, 0);
          var line = {
            time: hourTime,
            numerator: allData[i][dataReq[0]],
            denominator: allData[i][dataReq[1]]
          }
          dataArr.push(line);
        }

        var groupedData = dataArr.reduce(function (acc, obj) {
          var key = obj['time'].toISOString();
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(obj);
          return acc;
        }, {});

        var hostData = [];
        for (var key in groupedData) {
          var line = {};
          line.time = groupedData[key][0].time;
          var numerator = groupedData[key].reduce(function (accumulator, currentValue) {
            return accumulator + currentValue.numerator;
          }, 0);
          var denominator = groupedData[key].reduce(function (accumulator, currentValue) {
            return accumulator + currentValue.denominator;
          }, 0);   
          line.data = numerator / denominator;     
          hostData.push(line);
        }
      }
      res.send({earliest: earliest.date, latest: latest.date, data: hostData});
    });

  

//   Mins.find({
//     feedtype: feedtype, 
//     hostname: hostname,
//     date: { 
//       $gte: startTime,
//       $lte: endTime
//     }
//   }, function(err, allData){
//     if (err) {
//       console.log(err);
//     } else {
  //     console.log("hostData.js triggered");
  //     console.log(endTime);
  //     if ((endTime.getTime() - startTime.getTime()) < (1000*60*60*24)) {
  //       var hostData = [];
  //       for (var i = 0; i < allData.length; i++) {
  //         var line = {
  //           time: allData[i].date,
  //           data: allData[i][datatype]
  //         }
  //         hostData.push(line);
  //       }
  //       console.log(hostData.length);
  //       // res.send(dataArr);
  //     } else {
  //       var dataArr = [];
  //       for (var i = 0; i < allData.length; i++) {
  //         // parse
  //         var hourTime = allData[i].date;
  //         hourTime.setMinutes(0);
  //         var line = {
  //           time: hourTime,
  //           numerator: allData[i][dataReq[0]],
  //           denominator: allData[i][dataReq[1]]
  //         }
  //         dataArr.push(line);
  //       }

  //       var groupedData = dataArr.reduce(function (acc, obj) {
  //         var key = obj['time'].toISOString();
  //         if (!acc[key]) {
  //           acc[key] = [];
  //         }
  //         acc[key].push(obj);
  //         return acc;
  //       }, {});
        
  //       // var groupedData = groupBy(dataArr, 'time');

  //       // console.log("dataArr:");
  //       // console.log(dataArr);
  //       // console.log("groupedData:");
  //       // console.log(groupedData);

  //       var hostData = [];
  //       for (var key in groupedData) {
  //         var line = {};
  //         line.time = groupedData[key][0].time;
  //         var numerator = groupedData[key].reduce(function (accumulator, currentValue) {
  //           return accumulator + currentValue.numerator;
  //         }, 0);
  //         var denominator = groupedData[key].reduce(function (accumulator, currentValue) {
  //           return accumulator + currentValue.denominator;
  //         }, 0);   
  //         line.data = numerator / denominator;     
  //         hostData.push(line);
  //       }
  //     }
  //     res.send(hostData);
  //   }
  // });
});

module.exports = router;