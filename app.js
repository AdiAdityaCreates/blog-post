const dns = require("dns");
dns.setServers(["8.8.8.8"]);
require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");

const authRoutes = require("./src/routes/authRoutes");
const postRoutes = require("./src/routes/postRoutes");
const { attachUserIfExists } = require("./src/middleware/auth");

const app = express();
const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET || "default_jwt_secret_dev";

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));

// Body & cookie parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Allows <form method="POST"> + ?_method=PUT/DELETE to work as real PUT/DELETE
app.use(methodOverride("_method"));

// Static files (css, client js, images)
app.use(express.static(path.join(__dirname, "src", "public")));

// Flash messages need a session to temporarily store the message
// (this session is ONLY for flash messages, NOT for auth - auth is 100% JWT-based)
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

// Make flash messages and user available in every view automatically
app.use((req, res, next) => {
  res.locals.user = null;
  res.locals.messages = req.flash();
  next();
});

// Routes
app.get("/", attachUserIfExists, (req, res) => res.redirect("/posts"));
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke on the server");
});

module.exports = app;
