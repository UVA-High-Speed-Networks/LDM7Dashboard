var express = require('express');
var router = express.Router();
var path = require('path');

/* GET users listing. */
router.get('/:feedtype/:hostname', function(req, res, next) {
  res.sendFile(path.resolve('views/history.html'));
});

module.exports = router;
