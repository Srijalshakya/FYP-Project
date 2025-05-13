const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Username is required"],
    unique: false,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    code: Number,
    expiresAt: Date,
  },
  resetPasswordOtp: {
    code: Number,
    expiresAt: Date,
  },
  pendingEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);