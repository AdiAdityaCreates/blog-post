const User = require("../models/User");
const generateTokenAndSetCookie = require("../utils/generateToken");

// GET /auth/signup
exports.getSignup = (req, res) => {
  res.render("auth/signup", { title: "Sign Up" });
};

// POST /auth/signup
exports.postSignup = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      req.flash("error", "All fields are required");
      return res.redirect("/auth/signup");
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      req.flash("error", "Username must be between 3 and 30 characters");
      return res.redirect("/auth/signup");
    }

    if (password.length < 6) {
      req.flash("error", "Password must be at least 6 characters");
      return res.redirect("/auth/signup");
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/auth/signup");
    }

    const existingUser = await User.findOne({
      $or: [{ email: trimmedEmail }, { username: trimmedUsername }],
    });
    if (existingUser) {
      req.flash("error", "Username or email already in use");
      return res.redirect("/auth/signup");
    }

    // Password hashing happens automatically in the User model's pre-save hook
    const user = await User.create({
      username: trimmedUsername,
      email: trimmedEmail,
      password,
    });

    generateTokenAndSetCookie(res, user._id);
    req.flash("success", "Account created successfully");
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      req.flash("error", "Username or email already in use");
    } else if (err.errors) {
      const firstError = Object.values(err.errors)[0]?.message || "Validation failed";
      req.flash("error", firstError);
    } else {
      req.flash("error", "Something went wrong during signup");
    }
    res.redirect("/auth/signup");
  }
};

// GET /auth/login
exports.getLogin = (req, res) => {
  res.render("auth/login", { title: "Login" });
};

// POST /auth/login
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash("error", "Email and password are required");
      return res.redirect("/auth/login");
    }

    const trimmedEmail = email.trim().toLowerCase();

    // .select("+password") needed because schema has select:false on password
    const user = await User.findOne({ email: trimmedEmail }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/auth/login");
    }

    generateTokenAndSetCookie(res, user._id);
    req.flash("success", "Logged in successfully");
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong during login");
    res.redirect("/auth/login");
  }
};

// GET /auth/logout
exports.logout = (req, res) => {
  const cookieName = process.env.JWT_COOKIE_NAME || "token";
  res.clearCookie(cookieName);
  req.flash("success", "Logged out successfully");
  res.redirect("/auth/login");
};
