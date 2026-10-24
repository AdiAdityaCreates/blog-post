const mongoose = require("mongoose");
const Post = require("../models/Post");

// GET /posts  -> public feed: public posts from everyone + private posts owned by the viewer
exports.getAllPosts = async (req, res) => {
  try {
    const filter = req.user
      ? { $or: [{ visibility: "public" }, { owner: req.user._id }] }
      : { visibility: "public" };

    const posts = await Post.find(filter)
      .populate("owner", "username")
      .sort({ createdAt: -1 });

    res.render("posts/index", { title: "All Posts", posts });
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not load posts");
    res.render("posts/index", { title: "All Posts", posts: [] });
  }
};

// GET /posts/new
exports.getNewPostForm = (req, res) => {
  res.render("posts/new", { title: "New Post" });
};

// POST /posts
exports.createPost = async (req, res) => {
  try {
    const { title, content, visibility } = req.body;

    if (!title || !content || !title.trim() || !content.trim()) {
      req.flash("error", "Title and content cannot be empty");
      return res.redirect("/posts/new");
    }

    await Post.create({
      title: title.trim(),
      content: content.trim(),
      visibility: visibility === "private" ? "private" : "public",
      owner: req.user._id,
    });

    req.flash("success", "Post created");
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not create post");
    res.redirect("/posts/new");
  }
};

// GET /posts/:id
exports.getSinglePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    const post = await Post.findById(req.params.id).populate("owner", "username");

    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    // enforce visibility: private posts only visible to their owner
    const isOwner =
      req.user &&
      post.owner &&
      post.owner._id &&
      post.owner._id.toString() === req.user._id.toString();

    if (post.visibility === "private" && !isOwner) {
      req.flash("error", "This post is private");
      return res.redirect("/posts");
    }

    res.render("posts/show", { title: post.title, post, isOwner: !!isOwner });
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not load post");
    res.redirect("/posts");
  }
};

// GET /posts/:id/edit  (checkOwnership middleware already ran -> req.post is safe to use)
exports.getEditPostForm = (req, res) => {
  res.render("posts/edit", { title: "Edit Post", post: req.post });
};

// PUT /posts/:id
exports.updatePost = async (req, res) => {
  try {
    const { title, content, visibility } = req.body;

    if (!title || !content || !title.trim() || !content.trim()) {
      req.flash("error", "Title and content cannot be empty");
      return res.redirect(`/posts/${req.params.id}/edit`);
    }

    req.post.title = title.trim();
    req.post.content = content.trim();
    req.post.visibility = visibility === "private" ? "private" : "public";
    await req.post.save();

    req.flash("success", "Post updated");
    res.redirect(`/posts/${req.post._id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not update post");
    res.redirect(`/posts/${req.params.id}/edit`);
  }
};

// DELETE /posts/:id
exports.deletePost = async (req, res) => {
  try {
    await req.post.deleteOne();
    req.flash("success", "Post deleted");
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not delete post");
    res.redirect("/posts");
  }
};

// GET /posts/mine  -> only the logged-in user's own posts
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ owner: req.user._id })
      .populate("owner", "username")
      .sort({ createdAt: -1 });

    res.render("posts/index", { title: "My Posts", posts });
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not load your posts");
    res.redirect("/posts");
  }
};
