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
                books: books
            });
            return;
        }
        dbConn.query(query, [req.body.title, req.body.author, req.body.publisher], function (err, result) {
            if (err) {
                res.render('book_catalogue', {
                    message: "A book with same title already added",
                    books: books
                });
                return;
            }
            books.push({
                title: req.body.title,
                author: req.body.author,
                publisher: req.body.publisher
            });
            books.sort(function (a, b) {
                if (a.title < b.title) {
                    return -1;
                }
                if (a.title > b.title) {
                    return 1;
                }
                return 0;
            });
            res.render('book_catalogue', {
                books: books,
                message: 'Book added successfully'
            });
        });
    });
});

router.post('/remove', auth, function (req, res, next) {
    var query = `DELETE FROM books WHERE title='${req.body.title}';`;
    dbConn.query("SELECT * FROM books", function (err, books) {
        if (err) {
            res.render('error', {
                message: err.message,
                error: err

            });
            return;
        }
        dbConn.query(query, function (err, result) {
            if (err) {
                res.render('book_catalogue', {
                    message: err.message,
                    books: books
                });
                return;
            }
            books = books.filter(book => book.title !== req.body.title);
            res.render('book_catalogue', {
                books: books,
                message: 'Book removed successfully'
            });
        });
    });
});

router.post('/update', auth, function (req, res, next) {
    res.render('update_book', {
        title: req.body.title,
        author: req.body.author,
        publisher: req.body.publisher
    });
});

router.post('/update_confirm', auth, function (req, res, next) {
    var query = `UPDATE books SET title='${req.body.title}', author='${req.body.author}', publisher='${req.body.publisher}' WHERE title='${req.body.old_title}'`;
    if (req.body.title === '' || req.body.author === '' || req.body.publisher === '') {
        res.render('update_book', {
            message: 'All fields are required',
            title: req.body.old_title,
            author: req.body.old_author,
            publisher: req.body.old_publisher
        });
        return;
    }
    dbConn.query(query, function (err, result) {
        if (err) {
            res.render('update_book', {
                message: err.message,
                title: req.body.old_title,
                author: req.body.old_author,
                publisher: req.body.old_publisher
            });
            return;
        }
        res.render('update_book', {
            message: 'Book updated',
            title: req.body.title,
            author: req.body.author,
            publisher: req.body.publisher
        });
    });
});


router.get('/requests', auth, function (req, res, next) {
    dbConn.query("SELECT * FROM transactions WHERE request_status!='0'", function (err, result) {
        if (err) {
            res.render('error', {
                error: err
            });
            return;
        }
        res.render('manage_book_requests', {
            requests: result
        });
    });
});

router.post('/requests/approve', auth, function (req, res, next) {
    dbConn.query("SELECT * FROM transactions", function (err, transactions) {
        if (err) {
            res.render('error', {
                error: err,
                message: err.message
            });
            return;
        }
        result = transactions.filter(item => parseInt(item.id) === parseInt(req.body.id));
        if (result.length === 0 || parseInt(req.body.request_status) !== parseInt(result[0].request_status)) {
            res.status(400).send('Bad Request');
            return;
        }
        if (req.body.request_status == '-1') {
            dbConn.query(`UPDATE transactions SET request_status='0', returned_at=CURRENT_DATE() WHERE id=${req.body.id};`, function (err, result) {
                if (err) {
                    res.render('error', {
                        error: err,
                        message: err.message
                    });
                    return;
                }
                transactions = transactions.filter(item => item.request_status !== 0 && parseInt(item.id) !== parseInt(req.body.id));
                res.render('manage_book_requests', {
                    message: 'Request Approved successfully, book issued',
                    requests: transactions
                });
            });
        } else {
            console.log(`UPDATE transactions SET request_status='0', issued_at=CURRENT_DATE() WHERE id=${req.body.id};`);
            dbConn.query(`UPDATE transactions SET request_status='0', issued_at=CURRENT_DATE() WHERE id=${req.body.id};`, function (err, result) {
                if (err) {
                    res.render('error', {
                        error: err,
                        message: err.message
                    });
                    return;
                }
                transactions = transactions.filter(item => item.request_status !== 0 && parseInt(item.id) !== parseInt(req.body.id));
                res.render('manage_book_requests', {
                    message: 'Request Approved successfully, book issued',
                    requests: transactions
                });
            });
        }
    });

});


router.post('/requests/deny', auth, function (req, res, next) {
    dbConn.query("SELECT * FROM transactions", function (err, transactions) {
        if (err) {
            res.render('error', {
                error: err,
                message: err.message
            });
            return;
        }
        result = transactions.filter(item => parseInt(item.id) === parseInt(req.body.id));
        if (result.length === 0 || parseInt(req.body.request_status) !== parseInt(result[0].request_status)) {
            res.status(400).send('Bad Request');
            return;
        }
        if (result[0].request_status === '1') {
            dbConn.query(`DELETE from transactions WHERE id=${req.body.id};`, function (err, result) {
                if (err) {
                    res.render('error', {
                        error: err,
                        message: err.message
                    });
                    return;
                }
                transactions = transactions.filter(item => parseInt(item.id) !== parseInt(req.body.id));
                res.render('manage_book_requests', {
                    message: 'Request Denied successfully, book not issued',
                    requests: transactions
                });
            });
        } else {
            dbConn.query(`UPDATE transactions SET request_status='0' WHERE id=${req.body.id};`, function (err, result) {
                if (err) {
                    res.render('error', {
                        error: err,
                        message: err.message
                    });
                    return;
                }
                transactions = transactions.filter(item => item.request_status !== 0 && parseInt(item.id) !== parseInt(req.body.id));
                res.render('manage_book_requests', {
                    message: 'Request Denied successfully, book not returned',
                    requests: transactions
                });
            });
        }
    });
});


router.get('/access', auth, function (req, res, next) {
    dbConn.query("SELECT * FROM admin_requests", function (err, result) {
        if (err) {
            res.render('error', {
                error: err
            });
            return;
        }
        res.render('admin_requests', {
            requests: result
        });
    });
});

router.post('/access/approve', auth, function (req, res, next) {
    dbConn.query("UPDATE users SET isadmin=true WHERE username=?", [req.body.username], function (err, result) {
        if (err) {
            res.render('error', {
                error: err,
                message: err.message
            });
            return;
        }
        dbConn.query("DELETE FROM admin_requests WHERE username=?", [req.body.username], function (err, result) {
            if (err) {
                res.render('error', {
                    error: err,
                    message: err.message
                });
                return;
            }
            dbConn.query("SELECT * FROM admin_requests", function (err, result) {
                if (err) {
                    res.render('error', {
                        error: err,
                        message: err.message
                    });
                    return;
                }
                res.render('admin_requests', {
                    requests: result,
                    message: 'Access granted successfully'
                });
            });
        });
    });
});

router.post('/access/deny', auth, function (req, res, next) {
    dbConn.query("DELETE FROM admin_requests WHERE username=?", [req.body.username], function (err, result) {
        if (err) {
            res.render('error', {
                error: err,
                message: err.message
            });
            return;
        }
        dbConn.query("SELECT * FROM admin_requests", function (err, result) {
            if (err) {
                res.render('error', {
                    error: err,
                    message: err.message
                });
                return;
            }
            res.render('admin_requests', {
                requests: result,
                message: 'Request denied successfully'
            });
        });
    });
});

module.exports = router;