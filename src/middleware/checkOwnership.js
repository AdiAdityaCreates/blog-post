const mongoose = require("mongoose");
const Post = require("../models/Post");

/**
 * Ensures the logged-in user is the OWNER of the post they're
 * trying to edit/delete. This is the "authorization" layer that
 * sits on top of "authentication" (protect middleware).
 *
 * protect  -> "who are you?"
 * this     -> "are you allowed to touch THIS specific resource?"
 */
const checkOwnership = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    if (!post.owner || post.owner.toString() !== req.user._id.toString()) {
      req.flash("error", "You are not authorized to modify this post");
      return res.redirect("/posts");
    }

    req.post = post; // pass it along so the controller doesn't re-fetch it
    next();
  } catch (err) {
    if (err.name === "CastError") {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }
    next(err);
  }
};

module.exports = checkOwnership;
