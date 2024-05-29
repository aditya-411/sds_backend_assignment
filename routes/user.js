var express = require('express');
var router = express.Router();
var auth = require('../config/auth').normal;
var dbConn = require('../config/db');

/* GET users listing. */
router.get('/', auth, function(req, res, next) {
  res.render('user_home', {username: req.user.username});
  console.log(req.user);
});

router.get('/browse', auth, function(req, res, next) {
  dbConn.query("SELECT * FROM books", function(err, result) {
    if (err) {
      res.render('error', {error: err});
      return;
    }
    res.render('browse_books_user', {books: result});
  });
});

router.post('/issue', auth, function(req, res, next) {
  res.render('issue_book', {book:req.body, message:'', show_button: true});
});

router.post('/confirm', auth, function(req, res, next) {
  dbConn.query("SELECT COUNT(*) AS count FROM history", function(err, result) {
    if (err) {
      res.render('error', {error: err});
      return;
    }
    var id = result[0].count + 1;
    console.log(id);
    dbConn.query("INSERT INTO pending_approvals (title, id, username) VALUES (?, ?, ?)", [req.body.title, id, req.user.username], function(err, result) {
      if (err) {
        res.render('error', {error: err});
        return;
      }
      res.render('issue_book', {book: req.body, message:'book issue requested successfully', show_button: false});
    });
    
  });
});


module.exports = router;
