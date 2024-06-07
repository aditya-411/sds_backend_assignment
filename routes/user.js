var express = require('express');
var router = express.Router();
var auth = require('../utils/auth').normal;
var dbConn = require('../utils/db');

/* GET users listing. */
router.get('/', auth, function (req, res, next) {
  res.render('user_home', {
    username: req.user.username,
    isadmin: req.user.admin
  });
});

router.get('/browse', auth, function (req, res, next) {
  dbConn.query("SELECT * FROM books", function (err, result) {
    if (err) {
      res.render('error', {
        error: err,
        message: err.message
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
  dbConn.query(`SELECT * FROM transactions WHERE username = '${req.user.username}'`, function (err, result) {
    if (err) {
      res.render('error', {
        error: err,
        message: err.message
      });
      return;
    }

    var filtered_result = result.filter(item => item.request_status === '1');
    if (filtered_result.length > 0) {
      if (filtered_result[0]['title'] === req.body.title) {
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
    filtered_result = result.filter(item => item.title === req.body.title && item.returned_at === null && item.request_status === '0');
    if (filtered_result.length > 0) {
      res.render('issue_book', {
        book: req.body,
        message: 'You already have this book issued',
        show_button: false
      });
      return;
    }
    var id;
    if (result.length === 0){
      id = 1;
    } else{
      var id = Math.max(...result.map(item => item.id)) + 1;
    }

    dbConn.query("INSERT INTO transactions (id, title, username, request_status) VALUES (?, ?, ?, '1')", [id, req.body.title, req.user.username], function (err, result) {
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

router.get('/my_books', auth, function (req, res, next) {
  dbConn.query("SELECT * FROM transactions WHERE username = ?", [req.user.username], function (err, result) {
    if (err) {
      res.render('error', {
        error: err,
        message: err.message
      });
      return;
    }
    var currentlyIssuedBooks = result.filter(item => item.request_status !== '1' && item.returned_at === null);
    var pendingResult = result.filter(item => item.request_status === '1' || item.request_status === '-1');
    var bookHistory = result.filter(item => item.request_status === '0' && item.returned_at !== null);
    dbConn.query("SELECT * FROM books", function (err, booksResult) {
      res.render('view_books_user', {
        allBooks: booksResult,
        currentlyIssuedBooks: currentlyIssuedBooks,
        bookHistory: bookHistory,
        pendingBooks: pendingResult,
        message: ''
      });
    });
  });
});


router.post('/return', auth, function (req, res, next) {
  dbConn.query("SELECT * FROM transactions WHERE username = ?", [req.user.username, req.body.title], function (err, result) {
    if (err) {
      res.render('error', {
        error: err,
        message: err.message
      });
      return;
    }

    var currentlyIssuedBooks = result.filter(item => item.request_status !== '1' && item.returned_at === null);
    var pendingResult = result.filter(item => item.request_status === '1' || item.request_status === '-1');
    var bookHistory = result.filter(item => item.request_status === '0' && item.returned_at !== null);

    dbConn.query("SELECT * FROM books", function (err, booksResult) {
      if (err) {
        res.render('error', {
          error: err,
          message: err.message
        });
        return;
      }
      var book = currentlyIssuedBooks.filter(item => item.title === req.body.title);
      if (book.length === 0) {
        res.render('view_books_user', {
          allBooks: booksResult,
          currentlyIssuedBooks: currentlyIssuedBooks,
          bookHistory: bookHistory,
          pendingBooks: pendingResult,
          message: 'You do not have this book issued, don\'t try to be smart'
        });
        return;
      }
      var book = pendingResult.filter(item => item.title === req.body.title && item.request_status === '-1');
      if (book.length > 0) {
        res.render('view_books_user', {
          allBooks: booksResult,
          currentlyIssuedBooks: currentlyIssuedBooks,
          bookHistory: bookHistory,
          pendingBooks: pendingResult,
          message: 'You already have a pending return request for this book'
        });
        return;
      }
      var index = result.findIndex(item => parseInt(item.id) === parseInt(req.body.id));
      result[index].request_status = '-1';
      pendingResult.push(result[index]);
      dbConn.query("UPDATE transactions SET request_status = '-1' WHERE id = ?", [req.body.id], function (err, result1) {
        if (err) {
          res.render('view_books_user', {
            allBooks: booksResult,
            currentlyIssuedBooks: currentlyIssuedBooks,
            bookHistory: bookHistory,
            pendingBooks: pendingResult,
            message: err.message
          });
          return;
        }

        res.render('view_books_user', {
          allBooks: booksResult,
          currentlyIssuedBooks: currentlyIssuedBooks,
          bookHistory: bookHistory,
          pendingBooks: pendingResult,
          message: 'Book return requested successfully'
        });
      });
    });
  });
});


router.post('/request_admin', auth, function (req, res, next) {
  dbConn.query("SELECT * from users where username = ?", [req.user.username], function (err, result) {
    if (err) {
      res.render('error', {
        error: err,
        message: err.message
      });
      return;
    }
    if (result[0].isadmin === 1) {
      res.render('user_home', {
        username: req.user.username,
        message: 'You are already an admin'
      });
      return;
    }
    if (result[0].admin_request === 1) {
      res.render('user_home', {
        username: req.user.username,
        message: 'You already have a pending admin request'
      });
      return;
    }
    dbConn.query("UPDATE users SET admin_request = true WHERE username = ?", [req.user.username], function (err, result) {
      if (err) {
        res.render('error', {
          error: err,
          message: err.message
        });
        return;
      }
      res.render('user_home', {
        username: req.user.username,
        message: 'Admin request submitted successfully'
      });
    });
  });
});




module.exports = router;