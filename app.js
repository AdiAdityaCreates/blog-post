require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");

const authRoutes = require("./src/routes/authRoutes");
const postRoutes = require("./src/routes/postRoutes");
const { attachUserIfExists } = require("./src/middleware/auth");

const app = express();

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

// Vercel turns 302 into 307 (which re-sends the POST). Default to 303 so the browser switches to GET.
app.use((req, res, next) => {
  const redirect = res.redirect.bind(res);
  res.redirect = (a, b) => (typeof a === "number" ? redirect(a, b) : redirect(303, a));
  next();
});

// Cookie-based flash messages (serverless-safe: no in-memory session needed).
// Same API as connect-flash: req.flash(type, msg) to add, req.flash() to read & clear.
app.use((req, res, next) => {
  let incoming = {};
  try {
    if (req.cookies.flash) incoming = JSON.parse(req.cookies.flash);
  } catch (e) {
    incoming = {};
  }
  if (req.cookies.flash) res.clearCookie("flash");

  let outgoing = null;
  req.flash = (type, msg) => {
    if (type === undefined) {
      const out = incoming;
      incoming = {};
      return out;
    }
    outgoing = outgoing || {};
    (outgoing[type] = outgoing[type] || []).push(msg);
    res.cookie("flash", JSON.stringify(outgoing), {
      httpOnly: true,
      sameSite: "lax",
      secure: (process.env.NODE_ENV || "").trim() === "production",
      maxAge: 60 * 1000,
    });
  };
  next();
});

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