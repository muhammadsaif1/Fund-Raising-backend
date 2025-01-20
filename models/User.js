const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "organization", "admin"],
    required: true,
  },
  description: {
    type: String,
    required: function () {
      return this.role === "organization";
    },
  },
  proofImage: {
    type: String,
    required: function () {
      return this.role === "organization";
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationDate: {
    type: Date,
  },
  accountDetails: {
    accountNumber: { type: String, default: "" },
    accountTitle: { type: String, default: "" },
    bankName: { type: String, default: "" },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password with hashed password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

module.exports = mongoose.model("User", UserSchema);
