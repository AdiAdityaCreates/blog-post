const jwt = require("jsonwebtoken");

/**
 * Signs a JWT for a given user id and sets it as an httpOnly cookie.
 * httpOnly = true -> JS on the client can't read it (protects against XSS stealing the token)
 */
const generateTokenAndSetCookie = (res, userId) => {
  const cookieName = process.env.JWT_COOKIE_NAME || "token";
  const secret = process.env.JWT_SECRET || "default_jwt_secret_dev";
  const token = jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
};

module.exports = generateTokenAndSetCookie;
