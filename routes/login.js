var express = require('express');
var router = express.Router();
var dbConn = require('../config/db');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require('../config/auth').login;



// render login jade page
router.get('/', auth, function (req, res, next) {
  res.render('login', {
    bottom_text: ''
  });
});

// login auth
router.post('/',  function (req, res) {

  username = req.body.username;
  password = req.body.password;

  dbConn.query("SELECT * FROM users WHERE username = ?", [username], function (err, result) {
    if (err) {
      res.render('login', {
        bottom_text: 'Error in database query'
      });
      return;
    }
    if (result.length === 0) {
      res.render('login', {
        bottom_text: 'Invalid username or password'
      });
      return;
    }
    var user = result[0];
    bcrypt.compare(password, user.password).then(function (result) {
      if (result) {

        const options = {
          expiresIn: 60 * 60
        }

        const token = jwt.sign({
          username: username,
          admin: user.isadmin
        }, process.env.JWT_SECRET, options);

        res.cookie('jwt', token).status(200);
        if (user.isadmin) {
          res.redirect('/admin');
        } else {
          res.redirect('/user');
        }

      } else {
        res.render('login', {
          bottom_text: 'Invalid username or password'
        });
      }
    });
  });

});

router.post('/logout', function(_, res) {
  res.clearCookie('jwt');
  res.redirect('/');
});

module.exports = router;