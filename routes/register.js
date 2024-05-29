var express = require('express');
var router = express.Router();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
var dbConn = require('../config/db');
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const auth = require('../config/auth').login;


// render login jade page
router.get('/', auth, function (req, res, next) {
    res.render('register', {
        bottom_text: ''
    });
});

// login auth
router.post('/', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var confirm_pass = req.body.confirm_password;

    if (password != confirm_pass) {
        res.render('register', {
            bottom_text: 'Passwords do not match'
        });
        return;
    } else if (password.length === 0) {
        res.render('register', {
            bottom_text: 'Empty password not allowed'
        });
        return;
    } else if (password.length < 8) {
        res.render('register', {
            bottom_text: 'Password is too short (min 8 characters)'
        });
        return;
    }
    bcrypt
        .genSalt(saltRounds)
        .then(salt => {
            return bcrypt.hash(password, salt)
        })
        .then(hash => {
            var hashed_password = hash;
            console.log("Username: " + username);
            console.log("Password:" + hashed_password);
            dbConn.query("INSERT INTO users (username, password, isadmin) VALUES (?, ?, False)", [username, hashed_password], function (err, result) {
                if (err) {
                    res.render('register', {
                        bottom_text: 'Account with that username already exists'
                    });
                    return;
                }
                res.render('register', {
                    bottom_text: 'Registration successful'
                });
            });

        })
        .catch(err => console.error(err.message))

    });

module.exports = router;