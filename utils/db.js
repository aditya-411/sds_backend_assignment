const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

const dbConn = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS ,
});

dbConn.connect(function(err) {
  if(err) throw err;
  dbConn.query("USE " + process.env.DATABASE, function (err, result) {
    if (err) throw err;
  });
  console.log('hey db is connected!');
});

module.exports = dbConn;