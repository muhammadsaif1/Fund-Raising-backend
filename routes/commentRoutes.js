const express = require("express");
const authenticate = require("../middleware/authHandler");
const {
  createComment,
  updateComment,
  deleteComment,
  getAllComments,
} = require("../controllers/commentController");

const commentRouter = express.Router();

commentRouter.post("/:userId/:postId", createComment);
commentRouter.get("/:postId", getAllComments);
commentRouter.put("/:userId/:postId/:commentId", updateComment);
commentRouter.delete("/:userId/:commentId", deleteComment);

module.exports = commentRouter;
