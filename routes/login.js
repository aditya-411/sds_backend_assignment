var express = require('express');
var router = express.Router();
var dbConn = require('../config/db');
const bcrypt = require("bcrypt");



// render login jade page
router.get('/', function(req, res, next) {
  res.render('login', {bottom_text:''});
});

// login auth
router.post('/', function(req, res) {

    username = req.body.username;
    password = req.body.password;

    dbConn.query("SELECT * FROM users WHERE username = ?", [username], function(err, result) {
        if (err) {
            res.render('login', {bottom_text:'Error in database query'});
            return;
        }
        if (result.length === 0) {
            res.render('login', {bottom_text:'Invalid username or password'});
            return;
        }
        var user = result[0];
        console.log(user);
        bcrypt.compare(password, user.password).then(function(result) {
            if (result) {
                res.render('login', {bottom_text:'Login successful'});
            } else {
                res.render('login', {bottom_text:'Invalid username or password'});
            }
        });
    });

});
  
module.exports = router;
