const express = require("express");
const {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  updatePost,
  likePost,
} = require("../controllers/postControllers");
const authenticate = require("../middleware/authHandler");
const { upload } = require("../config/cloudinary");

const postRouter = express.Router();

postRouter.post("/post/", authenticate, upload.single("image"), createPost);
postRouter.post("/posts/like/:postId", likePost);
postRouter.put("/:postId/edit", authenticate, updatePost);
postRouter.delete("/:postId/delete", authenticate, deletePost);
postRouter.get("/:postId", getPostById);
postRouter.get("/", getAllPosts);

module.exports = postRouter;
