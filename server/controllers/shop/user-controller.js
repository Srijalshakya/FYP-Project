const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const sendOtpMail = require("../../utils/sendOtpMail");

// Update User Profile (Username, Email, Password)
const updateUserProfile = async (req, res) => {
  const { userName, email, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate input
    if (!userName && !email && !currentPassword && !newPassword) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided for update",
      });
    }

    // Update Username
    if (userName && userName !== user.userName) {
      const existingUser = await User.findOne({ userName });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
      user.userName = userName;
    }

    // Update Email (requires verification)
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a VALID email address",
        });
      }

      const existingEmail = await User.findOne({ email });
      if (existingEmail && existingEmail._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      // Store the new email as pending and send OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      user.pendingEmail = email;
      user.otp = { code: otp, expiresAt };
      user.isVerified = false; // Reset verification status

      const emailSent = await sendOtpMail(email, otp, user.userName, "Email Verification OTP");
      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email",
        });
      }
    }

    // Update Password
    if (currentPassword && newPassword) {
      const checkPasswordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!checkPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      if (!/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message: "New password must contain at least one capital letter, one number, and only letters/numbers",
        });
      }

      user.password = await bcrypt.hash(newPassword, 12);
    } else if (currentPassword || newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current and new password are required to update password",
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: email && email !== user.email ? "OTP sent to new email for verification" : "Profile updated successfully",
      user: {
        userName: user.userName,
        email: user.email,
        pendingEmail: user.pendingEmail,
        isVerified: user.isVerified,
      },
    });
  } catch (e) {
    console.error("Update profile error:", e);
    if (e.code === 11000) {
      const field = Object.keys(e.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`,
      });
    }
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while updating profile",
    });
  }
};

// Request OTP for profile update (email)
const requestProfileUpdateOtp = async (req, res) => {
  const userId = req.user.id;
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    if (email === user.email) {
      return res.status(400).json({
        success: false,
        message: "New email must be different from current email",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.pendingEmail = email;
    user.otp = { code: otp, expiresAt };
    user.isVerified = false;

    await user.save();

    const emailSent = await sendOtpMail(email, otp, user.userName, "Email Verification OTP");
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent to new email for verification",
      user: {
        userName: user.userName,
        email: user.email,
        pendingEmail: user.pendingEmail,
        isVerified: user.isVerified,
      },
    });
  } catch (e) {
    console.error("Request profile update OTP error:", e);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while requesting OTP",
    });
  }
};

// Verify Email Update OTP
const verifyEmailUpdateOtp = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  try {
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({
        success: false,
        message: "No pending email update",
      });
    }

    const otpNumber = parseInt(otp, 10);

    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired. Please request a new one.",
      });
    }

    if (user.otp.code != otpNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Update email and clear pending email
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.isVerified = true;
    user.otp = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email updated and verified successfully",
      user: {
        userName: user.userName,
        email: user.email,
        pendingEmail: user.pendingEmail,
        isVerified: user.isVerified,
      },
    });
  } catch (e) {
    console.error("Verify email update OTP error:", e);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while verifying email",
    });
  }
};

// Resend Email Update OTP
const resendEmailUpdateOtp = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({
        success: false,
        message: "No pending email update",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = { code: otp, expiresAt };

    await user.save();

    const emailSent = await sendOtpMail(user.pendingEmail, otp, user.userName, "Email Verification OTP");
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "New OTP sent to your pending email",
    });
  } catch (e) {
    console.error("Resend email update OTP error:", e);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while resending OTP",
    });
  }
};

// Cancel Email Verification
const cancelEmailVerification = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({
        success: false,
        message: "No pending email update to cancel",
      });
    }

    user.pendingEmail = null;
    user.otp = undefined;
    user.isVerified = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verification cancelled successfully",
      user: {
        userName: user.userName,
        email: user.email,
        pendingEmail: user.pendingEmail,
        isVerified: user.isVerified,
      },
    });
  } catch (e) {
    console.error("Cancel email verification error:", e);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while cancelling email verification",
    });
  }
};

module.exports = {
  updateUserProfile,
  requestProfileUpdateOtp,
  verifyEmailUpdateOtp,
  resendEmailUpdateOtp,
  cancelEmailVerification,
};