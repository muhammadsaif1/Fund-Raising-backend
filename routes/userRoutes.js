const express = require("express");

const {
  registerUserOrOrganization,
  loginUserOrOrganization,
  updateUserOrOrganization,
  deleteUserOrOrganization,
  fetchAllUsersOrOrganizations,
  fetchUserOrOrganizationById,
  forgotPassword,
  resetPassword,
} = require("../controllers/userControllers");
const { upload } = require("../config/cloudinary");
const authenticate = require("../middleware/authHandler");
const User = require("../models/User");

const usersRouter = express.Router();

usersRouter.post(
  "/register",
  upload.single("proofImage"),
  registerUserOrOrganization
);
usersRouter.post("/login", loginUserOrOrganization);
usersRouter.put("/:userId/edit", updateUserOrOrganization);
usersRouter.delete("/:userId/delete", deleteUserOrOrganization);

usersRouter.get("/check-auth", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Authenticated User",
      user,
    });
  } catch (error) {
    console.error("Error in /check-auth:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

usersRouter.get("/users", fetchAllUsersOrOrganizations);
usersRouter.get("/:id", fetchUserOrOrganizationById);

usersRouter.post("/forgot-password", forgotPassword);
usersRouter.post("/reset-password", resetPassword);

module.exports = usersRouter;
