var express = require('express');
var router = express.Router();


// render login jade page
router.get('/', function(req, res, next) {
  res.render('login');
});

// login auth
router.post('/', function(req, res) {

    // Your authentication logic here
    
    res.send('respond with a resource');
});
  
module.exports = router;
