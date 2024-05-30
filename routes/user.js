var express = require('express');
var router = express.Router();
var auth = require('../config/auth').normal;
var dbConn = require('../config/db');

/* GET users listing. */
router.get('/', auth, function (req, res, next) {
  res.render('user_home', {
    username: req.user.username
  });
});

router.get('/browse', auth, function (req, res, next) {
  dbConn.query("SELECT * FROM books", function (err, result) {
    if (err) {
      res.render('error', {
        error: err
      });
      return;
    }
    res.render('browse_books_user', {
      books: result
    });
  });
});

router.post('/issue', auth, function (req, res, next) {
  res.render('issue_book', {
    book: req.body,
    message: '',
    show_button: true
  });
});

router.post('/issue_confirm', auth, function (req, res, next) {
  dbConn.query(`SELECT * FROM pending_approvals WHERE username = '${req.user.username}' and type=true;`, function (err, result) {
    if (err) {
      res.render('error', {
        error: err,
        message: err.message
      });
      return;
    }
    if (result.length > 0) {
      if (result[0]['title'] === req.body.title) {
        res.render('issue_book', {
          book: req.body,
          message: 'You already have an issue request pending for this book',
          show_button: false
        });
        return
      } else {
        res.render('issue_book', {
          book: req.body,
          message: 'You already have an issue request pending for a different book',
          show_button: false
        });
        return;
      }
    }
    dbConn.query("SELECT * FROM currently_issued WHERE username = ? AND title = ?", [req.user.username, req.body.title], function (err, result) {
      if (err) {
        res.render('error', {
          error: err,
          message: err.message
        });
        return;
      }
      if (result.length > 0) {
        res.render('issue_book', {
          book: req.body,
          message: 'You already have this book issued',
          show_button: false
        });
        return;
      }
      dbConn.query("INSERT INTO pending_approvals (title, username) VALUES (?, ?)", [req.body.title, req.user.username], function (err, result) {
        if (err) {
          res.render('error', {
            error: err,
            message: err.message
          });
          return;
        }
        res.render('issue_book', {
          book: req.body,
          message: 'Book issue requested successfully',
          show_button: false
        });
      });
    });


  });
});

router.get('/my_books', auth, function (req, res, next) {

  dbConn.query("SELECT * FROM books", function (err, booksResult) {
    if (err) {
      res.render('error', {
        error: err
      });
      return;
    }
    dbConn.query("SELECT * FROM currently_issued WHERE username = ?", [req.user.username], function (err, issuedResult) {
      if (err) {
        res.render('error', {
          error: err
        });
        return;
      }
      dbConn.query("SELECT * FROM history WHERE username = ?", [req.user.username], function (err, historyResult) {
        if (err) {
          res.render('error', {
            error: err
          });
          return;
        }
        dbConn.query("SELECT * FROM pending_approvals WHERE username = ?", [req.user.username], function (err, pendingResult) {
          if (err) {
            res.render('error', {
              error: err
            });
            return;
          }
          res.render('view_books_user', {
            allBooks: booksResult,
            currentlyIssuedBooks: issuedResult,
            bookHistory: historyResult,
            pendingBooks: pendingResult,
            message: ''
          });
        });
      });
    });
  });
});


router.post('/return', auth, function (req, res, next) {
  dbConn.query("SELECT * FROM pending_approvals WHERE username = ? AND title = ? AND type = false", [req.user.username, req.body.title], function (err, result) {
    if (err) {
      res.render('error', {
        error: err,
        message: err.message
      });
      return;
    }
    if (result.length > 0) {
      console.log(req.body.allBooks);
      res.render('view_books_user', {
        book: req.body,
        message: 'Return approval already pending for this book',
        currentlyIssuedBooks: req.body.currentlyIssuedBooks,
        bookHistory: req.body.bookHistory,
        allBooks: req.body.allBooks,
        pendingBooks: req.body.pendingBooks

      });
      return;
    }
    dbConn.query("INSERT INTO pending_approvals (title, username, type) VALUES (?, ?, false)", [req.body.title, req.user.username], function (err, result) {
      if (err) {
        res.render('error', {
          error: err,
          message: err.message
        });
        return;
      }
      dbConn.query("SELECT * FROM pending_approvals WHERE username = ?", [req.user.username], function (err, pendingResult) {
        if (err) {
          res.render('error', {
            error: err
          });
          return;
        }
        console.log(pendingResult);
        res.render('view_books_user', {
          message: 'Return approval requested successfully',
          pendingBooks: pendingResult,
          currentlyIssuedBooks: req.body.currentlyIssuedBooks,
          bookHistory: req.body.bookHistory,
          allBooks: req.body.allBooks
        });
      });
    });
  });
});


module.exports = router;