var express = require('express');
var router = express.Router();
var Mins = require('../models/mins');

router.get("/", function(req, res){
  var currTime = new Date();
  // var currTime = new Date("2019-03-25T18:59:30Z");
  console.log(currTime);
  var startTime = currTime.setHours(currTime.getHours() - 1);
  Mins.find({date: { $gte: startTime}}, function(err, allData){
    if (err) {
      console.log(err);
    } else {
      var dataArr = [];
      for (var i = 0; i < allData.length; i++) {
        //parse
        var line = {
          time: allData[i].date,
          feedtype: allData[i].feedtype,
          hostname: allData[i].hostname,
          receivedSize: allData[i].receivedSize,
          receivedProd: allData[i].receivedProd,
          aggregatedLatency: allData[i].aggregatedLatency,
          completeSize: allData[i].completeSize,
          completeProd: allData[i].completeProd,
          maxLatencySize: allData[i].maxLatencySize,
          maxLatency: allData[i].maxLatency,
          avgThru: allData[i].avgThru,
          minThru: allData[i].minThru,
          maxLatencyThru: allData[i].maxLatencyThru,
          percentile80Thru: allData[i].percentile80Thru,
          ffdrSize: allData[i].ffdrSize,
          ffdrProd: allData[i].ffdrProd,
          negativeLatencyNum: allData[i].negativeLatencyNum
        }
        dataArr.push(line);
      }
      res.send(dataArr);
    }
  });
});

module.exports = router;