var express = require('express');
var router = express.Router();
var Mins = require('../models/mins');

router.get("/", function(req, res){
  var hostname = req.query.hostname;
  var feedtype = req.query.feedtype;

Mins.findOne({
      feedtype: feedtype, 
      hostname: hostname
    })
    .sort({date: 1})
    .exec(function (err, doc) {
        console.log("earliest date:");
        console.log(doc.date);
        var earliest = doc.date;
        res.send(earliest);
    });
});

module.exports = router;
