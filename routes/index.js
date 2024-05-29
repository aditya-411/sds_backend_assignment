var express = require('express');
var router = express.Router();
var auth = require('../config/auth').normal;

/* GET home page. */
router.get('/', auth , function(req, res, next) {
  res.render('index');
});

module.exports = router;
