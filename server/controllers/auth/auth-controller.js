const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const sendOtpMail = require("../../utils/sendOtpMail");

// Register
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one capital letter, one number, and only letters/numbers",
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { userName }] }).lean();
    if (existingUser) {
      if (existingUser.email === email && !existingUser.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await User.updateOne({ email }, { $set: { otp: { code: otp, expiresAt } } });
        await sendOtpMail(email, otp, userName);
        return res.status(200).json({
          success: true,
          message: "Account exists. New OTP sent for verification.",
        });
      }
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? "Email already in use" : "Username already taken",
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const newUser = new User({
      userName,
      email,
      password: hashPassword,
      otp: { code: otp, expiresAt },
    });

    await newUser.save();
    await sendOtpMail(email, otp, userName);

    res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify.",
    });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP required" });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email already verified" });
    }

    const otpNumber = parseInt(otp, 10);
    if (!user.otp || user.otp.code != otpNumber || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    await User.updateOne({ email }, { $set: { isVerified: true }, $unset: { otp: 1 } });

    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (e) {
    console.error("OTP verification error:", e);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email" });
    }

    const checkPasswordMatch = await bcrypt.compare(password, user.password);
    if (!checkPasswordMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, userName: user.userName },
      process.env.JWT_SECRET || "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000
    }).json({
      success: true,
      message: "Logged in successfully",
      user: { email: user.email, role: user.role, id: user._id, userName: user.userName },
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// Logout
const logoutUser = (req, res) => {
  res.clearCookie("token").json({ success: true, message: "Logged out successfully" });
};

// Resend OTP
const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await User.updateOne({ email }, { $set: { otp: { code: otp, expiresAt } } });
    await sendOtpMail(email, otp, user.userName);

    res.status(200).json({ success: true, message: "New OTP sent" });
  } catch (e) {
    console.error("Resend OTP error:", e);
    res.status(500).json({ success: false, message: "Failed to resend OTP" });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await User.updateOne({ email }, { $set: { resetPasswordOtp: { code: otp, expiresAt } } });
    await sendOtpMail(email, otp, user.userName, "Password Reset Request");

    res.status(200).json({ success: true, message: "Reset OTP sent" });
  } catch (e) {
    console.error("Forgot password error:", e);
    res.status(500).json({ success: false, message: "Failed to process forgot password" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password required" });
    }

    if (!/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Invalid password format" });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email" });
    }

    const otpNumber = parseInt(otp, 10);
    if (!user.resetPasswordOtp || user.resetPasswordOtp.code != otpNumber || user.resetPasswordOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const hashPassword = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ email }, { $set: { password: hashPassword }, $unset: { resetPasswordOtp: 1 } });

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (e) {
    console.error("Reset password error:", e);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CLIENT_SECRET_KEY");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

// Get All Users (Admin Only)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const users = await User.find({}, "userName email isVerified role pendingEmail").lean();
    res.status(200).json({ success: true, data: users });
  } catch (e) {
    console.error("Get users error:", e);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// Update User (Admin Only)
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { userName, password } = req.body;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    if (!userName && !password) {
      return res.status(400).json({ success: false, message: "At least one field required" });
    }

    const updateData = {};
    if (userName) updateData.userName = userName;
    if (password) {
      if (!/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/.test(password)) {
        return res.status(400).json({ success: false, message: "Invalid password format" });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated",
      data: { userName: user.userName, email: user.email, isVerified: user.isVerified, role: user.role }
    });
  } catch (e) {
    console.error("Update user error:", e);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

// Delete User (Admin Only)
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    if (req.user.id === userId) {
      return res.status(403).json({ success: false, message: "Cannot delete own account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (e) {
    console.error("Delete user error:", e);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

// Check Auth
const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      message: "Authenticated",
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        pendingEmail: user.pendingEmail || null,
      },
    });
  } catch (e) {
    console.error("Check auth error:", e);
    res.status(500).json({ success: false, message: "Authentication check failed" });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  const { userName, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!userName && !currentPassword && !newPassword) {
      return res.status(400).json({ success: false, message: "At least one field required" });
    }

    if (userName && userName !== user.userName) {
      const existingUser = await User.findOne({ userName });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ success: false, message: "Username already taken" });
      }
      user.userName = userName;
    }

    if (currentPassword && newPassword) {
      const checkPasswordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!checkPasswordMatch) {
        return res.status(401).json({ success: false, message: "Current password incorrect" });
      }

      if (!/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/.test(newPassword)) {
        return res.status(400).json({ success: false, message: "Invalid password format" });
      }

      user.password = await bcrypt.hash(newPassword, 12);
    } else if (currentPassword || newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password required" });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated",
      user: {
        userName: user.userName,
        email: user.email,
        pendingEmail: user.pendingEmail,
        isVerified: user.isVerified,
      },
    });
  } catch (e) {
    console.error("Update profile error:", e);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// Request OTP for Email Update
const requestProfileUpdateOtp = async (req, res) => {
  const userId = req.user.id;
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id.toString() !== userId) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    if (email === user.email) {
      return res.status(400).json({ success: false, message: "New email must be different" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.pendingEmail = email;
    user.otp = { code: otp, expiresAt };
    user.isVerified = false;

    await user.save();
    await sendOtpMail(email, otp, user.userName, "Your OTP Code - FitMart");

    res.status(200).json({
      success: true,
      message: "OTP sent to new email",
      user: {
        userName: user.userName,
        email: user.email,
        pendingEmail: user.pendingEmail,
        isVerified: user.isVerified,
      },
    });
  } catch (e) {
    console.error("Request OTP error:", e);
    res.status(500).json({ success: false, message: "Failed to request OTP" });
  }
};

// Verify Email Update OTP
const verifyEmailUpdateOtp = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  try {
    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({ success: false, message: "No pending email update" });
    }

    const otpNumber = parseInt(otp, 10);
    if (!user.otp || user.otp.code != otpNumber || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.isVerified = true;
    user.otp = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email updated and verified",
      user: {
        userName: user.userName,
        email: user.email,
        pendingEmail: user.pendingEmail,
        isVerified: user.isVerified,
      },
    });
  } catch (e) {
    console.error("Verify email OTP error:", e);
    res.status(500).json({ success: false, message: "Failed to verify email" });
  }
};

// Resend Email Update OTP
const resendEmailUpdateOtp = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({ success: false, message: "No pending email update" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = { code: otp, expiresAt };
    await user.save();
    await sendOtpMail(user.pendingEmail, otp, user.userName, "Your OTP Code - FitMart");

    res.status(200).json({ success: true, message: "New OTP sent" });
  } catch (e) {
    console.error("Resend OTP error:", e);
    res.status(500).json({ success: false, message: "Failed to resend OTP" });
  }
};

// Cancel Email Verification
const cancelEmailVerification = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({ success: false, message: "No pending email update" });
    }

    user.pendingEmail = null;
    user.otp = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verification cancelled",
      user: {
        userName: user.userName,
        email: user.email,
        pendingEmail: user.pendingEmail,
        isVerified: user.isVerified,
      },
    });
  } catch (e) {
    console.error("Cancel verification error:", e);
    res.status(500).json({ success: false, message: "Failed to cancel verification" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  authMiddleware,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUser,
  deleteUser,
  checkAuth,
  updateUserProfile,
  requestProfileUpdateOtp,
  verifyEmailUpdateOtp,
  resendEmailUpdateOtp,
  cancelEmailVerification
};