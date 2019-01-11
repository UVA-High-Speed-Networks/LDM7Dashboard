var express = require('express');
var router = express.Router();
var Mins = require('../models/mins');

router.get("/", function(req, res){
  var feedtype = req.query.feedtype;
  // var currTime = req.query.currTime;
  var currTime = new Date("2019-01-08T14:00:00.000Z")
  var startTime = currTime.setHours(currTime.getHours() - 1);
  // var startTime = new Date("2019-01-08T13:00:00.000Z")
  Mins.find({feedtype:feedtype, date: { $gte: startTime}}, function(err, allData){
    // Mins.find({feedtype:feedtype, hostname: hostname}, function(err, allData){
  // Mins.find({feedtype:feedtype}, function(err, allData){
    if (err) {
      console.log(err);
    } else {
      // console.log("hostStat.js Triggered");
      // console.log(allData[0]);
      var dataArr = [];
      for (var i = 0; i < allData.length; i++) {
        //parse
        var line = {
          // feedtype: feedtype,
          time: allData[i].date,
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