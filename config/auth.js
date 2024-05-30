const jwt = require("jsonwebtoken");

function AuthMiddleware(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) {
    res.redirect("/login");
  } else {
    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
      if (err) {
        res.redirect("/login");
      } else {
        req.user = decoded;
        next();
      }
    });
  }
}

function AuthMiddleware_login(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) {
    next();
  } else {
    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
      if (err) {
        next();
      } else {
        res.redirect("/");
      }
    });
  }
}

module.exports = {
  normal: AuthMiddleware,
  login: AuthMiddleware_login
};