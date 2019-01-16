var express = require('express');
var router = express.Router();
var Mins = require('../models/mins');

router.get("/", function(req, res){
  var currTime = new Date();
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
          receivedDelay: allData[i].receivedDelay,
          completeSize: allData[i].completeSize,
          completeProd: allData[i].completeProd,
          throughput: allData[i].throughput,
          ffdrSize: allData[i].ffdrSize,
          ffdrProd: allData[i].ffdrProd
        }
        dataArr.push(line);
      }
      res.send(dataArr);
    }
  });
});

module.exports = router;