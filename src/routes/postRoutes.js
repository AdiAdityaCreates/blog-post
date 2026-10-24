const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { protect, attachUserIfExists } = require("../middleware/auth");
const checkOwnership = require("../middleware/checkOwnership");

// Public feed - doesn't require login, but attaches user if logged in
// so private-post-visibility logic in the controller can work
router.get("/", attachUserIfExists, postController.getAllPosts);

// Everything below requires login
router.get("/mine", protect, postController.getMyPosts);
router.get("/new", protect, postController.getNewPostForm);
router.post("/", protect, postController.createPost);

// Single post view - public route, but attach user to check private-post ownership
router.get("/:id", attachUserIfExists, postController.getSinglePost);

// Edit/Update/Delete require login AND ownership of the specific post
router.get("/:id/edit", protect, checkOwnership, postController.getEditPostForm);
router.put("/:id", protect, checkOwnership, postController.updatePost);
router.delete("/:id", protect, checkOwnership, postController.deletePost);

module.exports = router;
