const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect: blocks the request entirely if there's no valid token.
 * Use on routes that REQUIRE login (dashboard, create post, etc.)
 */
const protect = async (req, res, next) => {
  const cookieName = process.env.JWT_COOKIE_NAME || "token";
  const secret = process.env.JWT_SECRET || "default_jwt_secret_dev";
  try {
    const token = req.cookies[cookieName];

    if (!token) {
      req.flash("error", "Please log in to continue");
      return res.redirect("/auth/login");
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      req.flash("error", "User no longer exists");
      return res.redirect("/auth/login");
    }

    req.user = user; // attach user to request for downstream handlers
    res.locals.user = user; // attach to views too
    next();
  } catch (err) {
    res.clearCookie(cookieName);
    req.flash("error", "Session expired, please log in again");
    return res.redirect("/auth/login");
  }
};

/**
 * attachUserIfExists: does NOT block the request.
 * Use on public routes (home page, public feed) so we can still show
 * "Logged in as X" if a valid token happens to exist, without forcing login.
 */
const attachUserIfExists = async (req, res, next) => {
  const cookieName = process.env.JWT_COOKIE_NAME || "token";
  const secret = process.env.JWT_SECRET || "default_jwt_secret_dev";
  try {
    const token = req.cookies[cookieName];
    if (!token) return next();

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
      res.locals.user = user;
    }
    next();
  } catch (err) {
    // invalid/expired token on a public route - just ignore it, don't block
    next();
  }
};

module.exports = { protect, attachUserIfExists };
