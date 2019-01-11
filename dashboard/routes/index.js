var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.resolve('views/index.html'));
  // res.sendFile('index.html');
});

router.get('/:feedtype/:hostname/:datatype', function(req, res, next) {
  res.sendFile(path.resolve('views/history.html'));
});

module.exports = router;
