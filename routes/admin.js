var express = require('express');
var router = express.Router();
var auth = require('../config/auth').admin;
var dbConn = require('../config/db');

/* GET users listing. */
router.get('/', auth, function (req, res, next) {
  res.render('admin_home', {
    username: req.user.username,
    isadmin: true
  });
});



module.exports = router;