const Post = require("../models/Post");
const User = require("../models/User");
const { ImageUploadUtils } = require("../config/cloudinary");

// @desc Get all posts
// @route GET /api/posts
// @access Public
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("createdBy", "name email")
      .populate("likes", "userName");
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch posts." });
  }
};

// @desc Get post by ID
// @route GET /api/posts/:id
// @access Public
const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("createdBy", "name email")
      .populate("likes", "userName");

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found." });
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch post." });
  }
};

// @desc Create a new post
// @route POST /api/posts
// @access Private (Organization only)
const createPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields." });
    }

    let imageUrl = "";
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${b64}`;
      imageUrl = await ImageUploadUtils(dataUrl);
    }

    const post = await Post.create({
      title,
      description,
      image: imageUrl,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully.",
      data: post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create post." });
  }
};

// @desc Update a post
// @route PUT /api/posts/:id
// @access Private (Organization only)

// const updatePost = async (req, res) => {
//   try {
//     const { postId, userId } = req.params;
//     const user = await User.findById(userId);

//     // if (!user || user.role !== "organization") {
//     //   return res
//     //     .status(403)
//     //     .json({ success: false, message: "Access denied." });
//     // }

//     const post = await Post.findById(postId);

//     if (!post || post.createdBy.toString() !== userId) {
//       return res
//         .status(403)
//         .json({ success: false, message: "Access denied." });
//     }

//     const updates = req.body;
//     if (req.file) {
//       const fileBuffer = req.file.buffer;
//       const uploadResult = await ImageUploadUtils(
//         fileBuffer.toString("base64")
//       );
//       updates.image = uploadResult.secure_url;
//     }

//     Object.assign(post, updates);
//     await post.save();

//     res.status(200).json({
//       success: true,
//       message: "Post updated successfully.",
//       data: post,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update post." });
//   }
// };
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params; // Get postId from the URL params
    const userId = req.user.id; // Get user ID from the authenticate middleware

    // Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found." });
    }

    // Verify that the logged-in user is the owner of the post
    if (post.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this post.",
      });
    }

    // Prepare updates
    const updates = req.body;

    // If a new file is uploaded, handle the image upload
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const uploadResult = await ImageUploadUtils(
        fileBuffer.toString("base64")
      );
      updates.image = uploadResult.secure_url; // Save the new image URL
    }

    // Apply the updates to the post object
    Object.assign(post, updates);
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully.",
      data: post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update post." });
  }
};

// @desc Delete a post
// @route DELETE /api/posts/:id
// @access Private (Organization only)
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);

    // if (!user || user.role !== "organization") {
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "Access denied." });
    // }

    const post = await Post.findById(postId);

    if (!post || post.createdBy.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete post." });
  }
};

const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const userIndex = post.likes.indexOf(userId);

    if (userIndex > -1) {
      post.likes.splice(userIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({ message: "Like status updated", likes: post.likes });
  } catch (error) {
    res.status(500).json({ message: "Error updating like status", error });
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
};
