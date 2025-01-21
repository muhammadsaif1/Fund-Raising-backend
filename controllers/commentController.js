const Comment = require("../models/Comment");
const Post = require("../models/Post");

// @desc Create a new comment
// @route POST /api/comments
// @access Private (Anyone authenticated can comment)
const createComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId, userId } = req.params;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Create the comment
    const comment = await Comment.create({
      text,
      post: postId,
      user: userId,
    });

    res.status(201).json({
      success: true,
      message: "Comment created successfully.",
      data: comment,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create comment." });
  }
};

// @desc Get all comments for a post
// @route GET /api/comments
// @access Public (Anyone can see comments)
const getAllComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Fetch all comments for this post
    const comments = await Comment.find({ post: postId }).populate(
      "user",
      "name"
    );

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to retrieve comments." });
  }
};

// @desc Update a comment
// @route PUT /api/comments/:commentId
// @access Private (Only the user who created the comment or an admin can update it)
const updateComment = async (req, res) => {
  try {
    const { userId, postId, commentId } = req.params;
    const { text } = req.body;

    // Fetch the comment to be updated
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }
    if (comment.post.toString() !== postId) {
      return res.status(400).json({
        success: false,
        message: "Comment does not belong to this post",
      });
    }

    // Check if the user is the one who created the comment or an admin
    if (comment.user.toString() !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    // Update the comment
    comment.text = text;
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment updated successfully.",
      data: comment,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update comment." });
  }
};

// @desc Delete a comment
// @route DELETE /api/comments/:commentId
// @access Private (Only the user who created the comment or an admin can delete it)
const deleteComment = async (req, res) => {
  try {
    const { userId, commentId } = req.params; // Get userId from body

    // Fetch the comment to be deleted
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    // Check if the user is the one who created the comment or an admin
    if (comment.user.toString() !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    // Delete the comment
    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete comment." });
  }
};

module.exports = {
  createComment,
  getAllComments,
  updateComment,
  deleteComment,
};
