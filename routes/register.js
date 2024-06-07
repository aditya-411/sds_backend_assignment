var express = require('express');
var router = express.Router();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
var dbConn = require('../utils/db');
const {
    render
} = require('../app');
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const auth = require('../utils/auth').login;
const auth1 = require('../utils/auth').normal;


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


router.get('/update_password', auth1, function (_, res) {
    res.render('update_password', {
        message: '',
        user: 'user'
    });
});

router.post('/update_password', auth1, function (req, res) {
    var user = null;
        if (req.user.isadmin){
            user = 'admin';
        } else {
            user = 'user'
        }
    if (req.body.currentPassword.length === 0) {
        res.render('update_password', {
            message: 'Please enter your current password',
            user: user
        });
    } else if (req.body.newPassword.length === 0) {
        res.render('update_password', {
            message: 'Please enter your new password',
            user: user
        });
    } else if (req.body.confirmPassword !== req.body.newPassword) {
        res.render('update_password', {
            message: 'New passwords do not match',
            user: 'user'
        });
    } else if (req.body.newPassword.length < 8) {
        res.render('update_password', {
            message: 'New password is too short (min 8 characters)',
            user: user
        });
        return;
    }
    
    else {
        
        
        dbConn.query("SELECT * FROM users WHERE username = ?", [req.user.username], function (err, result) {
            if (err) {
                res.render('update_password', {
                    messgae: 'Error in database query',
                    user: user
                });
                return;
            }
            if (result.length === 0) {
                res.render('update_password', {
                    message: 'Couldn\'t find user in database',
                    user: user
                });
                return;
            }
            var user = result[0];
            bcrypt.compare(req.body.currentPassword, user.password).then(function (result) {
                if (result) {
                    bcrypt
                        .genSalt(saltRounds)
                        .then(salt => {
                            console.log(req.body.newPassword, salt);
                            return bcrypt.hash(req.body.newPassword, salt);
                        })
                        .then(hash => {
                            var hashed_password = hash;
                            dbConn.query(`UPDATE users SET password ='${hashed_password}' WHERE username = '${req.user.username}';`, function (err, result) {
                                if (err) {
                                    res.render('update_password', {
                                        message: 'SQL query failed', user:user
                                    });
                                    return;
                                }
                                res.render('update_password', {
                                    message: 'Password updated successful', user:user
                                });
                            });

                        })
                        .catch(err => console.error(err.message))


                } else {
                    res.render('update_password', {
                        message: 'Invalid Password',
                        user: user
                    });
                }
            });
        });

    }
});

module.exports = router;