var express = require('express');
var router = express.Router();
var auth = require('../config/auth').admin;
var dbConn = require('../config/db');

router.get('/', auth, function (req, res, next) {
  res.render('admin_home', {
    username: req.user.username,
  });
});

router.get('/books', auth, function (req, res, next) {
    dbConn.query("SELECT * FROM books", function (err, result) {
        if (err) {
          res.render('error', {
            error: err
          });
          return;
        }
        res.render('book_catalogue', {
          books: result
        });
      });
});


router.post('/add', auth, function (req, res, next) {
    var query = "INSERT INTO books (title, author, publisher) VALUES (?, ?, ?)";
    dbConn.query("SELECT * FROM books", function (err, books) {
      if (err) {
        res.render('error', {
          message: err.message,
          error: err

        });
        return;
      }
      if (req.body.title === '' || req.body.author === '' || req.body.publisher === '') {
        res.render('book_catalogue', {
          message: 'All fields are required',
          books:books
        });
        return;
      }
      dbConn.query(query, [req.body.title, req.body.author, req.body.publisher], function (err, result) {
        if (err) {
          res.render('book_catalogue', {
            message: err.message,
            books: books
          });
          return;
        }
        books.push({
          title: req.body.title,
          author: req.body.author,
          publisher: req.body.publisher
        });
        res.render('book_catalogue', {
          books: books,
          message: 'Book added successfully'
        });
      });
    });
  });


module.exports = router;
