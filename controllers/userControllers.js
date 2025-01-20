const User = require("../models/User");
const { ImageUploadUtils } = require("../config/cloudinary");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// @desc Register a user or organization
// @route POST /api/auth/register
// @access Public
const registerUserOrOrganization = async (req, res) => {
  try {
    const { role, name, email, password, description } = req.body;

    if (!role || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Role, email, and password are required.",
      });
    }

    if (role === "organization" && (!name || !description || !req.file)) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, and proof image are required for organizations.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists." });
    }

    let proofImageUrl = "";
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${b64}`;
      proofImageUrl = await ImageUploadUtils(dataUrl);
    }

    const newUser = new User({
      role,
      name,
      email,
      password,
      description: role === "organization" ? description : undefined,
      proofImage: proofImageUrl,
    });

    await newUser.save();
    const token = newUser.generateAuthToken();

    res.status(201).json({
      success: true,
      message: `${
        role.charAt(0).toUpperCase() + role.slice(1)
      } registered successfully.`,
      data: newUser,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Registration failed." });
  }
};

// @desc Login user or organization
// @route POST /api/auth/login
// @access Public
const loginUserOrOrganization = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: `${
        user.role.charAt(0).toUpperCase() + user.role.slice(1)
      } logged in successfully.`,
      data: user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Login failed." });
  }
};

// @desc Update user or organization
// @route PUT /api/auth/:id
// @access Private
const updateUserOrOrganization = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User or organization not found.",
      });
    }

    if (user.role === "organization" && req.file) {
      const b64 = req.file.buffer.toString("base64");
      const uploadResult = await ImageUploadUtils(b64);
      updates.proofImage = uploadResult.secure_url;
    }

    Object.assign(user, updates);

    await user.save();

    res.status(200).json({
      success: true,
      message: `${
        user.role.charAt(0).toUpperCase() + user.role.slice(1)
      } updated successfully.`,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Update failed." });
  }
};

// @desc Delete user or organization
// @route DELETE /api/auth/:id
// @access Private
const deleteUserOrOrganization = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User or organization not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `${
        user.role.charAt(0).toUpperCase() + user.role.slice(1)
      } deleted successfully.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Deletion failed." });
  }
};

let otpStorage = {};

// @desc Fetch all users or organizations
// @route GET /api/auth/users
// @access Private
const fetchAllUsersOrOrganizations = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
};

// @desc Fetch user or organization by ID
// @route GET /api/auth/:id
// @access Private
const fetchUserOrOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User or organization not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user or organization.",
    });
  }
};

// @desc Forgot password with OTP
// @route POST /api/auth/forgot-password
// @access Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist.",
      });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStorage[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email address.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
    });
  }
};

// @desc Verify OTP and Reset Password
// @route POST /api/auth/reset-password
// @access Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required.",
      });
    }

    const storedOtpDetails = otpStorage[email];
    if (
      !storedOtpDetails ||
      storedOtpDetails.otp !== otp ||
      storedOtpDetails.expires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist.",
      });
    }

    user.password = newPassword;
    await user.save();

    delete otpStorage[email];

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password.",
    });
  }
};

module.exports = {
  registerUserOrOrganization,
  loginUserOrOrganization,
  updateUserOrOrganization,
  deleteUserOrOrganization,
  fetchUserOrOrganizationById,
  fetchAllUsersOrOrganizations,
  forgotPassword,
  resetPassword,
};
