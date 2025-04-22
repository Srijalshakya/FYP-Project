const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const sendOtpMail = require("../../utils/sendOtpMail");

// Register
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    // Validate input
    if (!userName || !email || !password) {
      return res.status(400).json({
        success: falso,
        message: "Please provide all required fields",
      });
    }

    // Check if email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Check password requirements
    if (!/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one capital letter, one number, and only letters/numbers",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email },
        { userName }
      ]
    }).lean();

    if (existingUser) {
      if (existingUser.email === email && !existingUser.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        await User.updateOne(
          { email },
          { $set: { otp: { code: otp, expiresAt } } }
        );
        
        const emailSent = await sendOtpMail(email, otp, userName);
        
        return res.status(200).json({
          success: true,
          message: "Account already exists. New OTP sent for verification.",
          emailSent,
        });
      }
      
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: "Email already in use. Please use a different email address.",
        });
      }
      if (existingUser.userName === userName) {
        return res.status(400).json({
          success: false,
          message: "Username already taken. Please choose a different username.",
        });
      }
    }

    // Create new user
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
    
    const emailSent = await sendOtpMail(email, otp, userName);
    
    if (!emailSent) {
      return res.status(201).json({
        success: true,
        message: "Account created but couldn't send verification email. Try resending OTP.",
        emailSent: false
      });
    }

    res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify.",
      emailSent: true
    });
  } catch (e) {
    console.error("Registration error:", e);
    if (e.code === 11000) {
      const field = Object.keys(e.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`,
      });
    }
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred during registration",
    });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and OTP are required" 
      });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already verified" 
      });
    }

    const otpNumber = parseInt(otp, 10);
    
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP not found or expired. Please request a new one." 
      });
    }
    
    if (user.otp.code != otpNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid OTP. Please try again." 
      });
    }
    
    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP has expired. Please request a new one." 
      });
    }

    await User.updateOne(
      { email },
      { $set: { isVerified: true }, $unset: { otp: 1 } }
    );

    res.status(200).json({ 
      success: true, 
      message: "Email verified successfully!" 
    });
  } catch (e) {
    console.error("OTP verification error:", e);
    res.status(500).json({ 
      success: false, 
      message: "An unexpected error occurred during verification" 
    });
  }
};

// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const checkUser = await User.findOne({ email }).lean();
    if (!checkUser) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist! Please register first",
      });
    }

    if (!checkUser.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const checkPasswordMatch = await bcrypt.compare(
      password,
      checkUser.password
    );
    
    if (!checkPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password! Please try again",
      });
    }

    const token = jwt.sign(
      {
        id: checkUser._id,
        role: checkUser.role,
        email: checkUser.email,
        userName: checkUser.userName,
      },
      process.env.JWT_SECRET || "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000
    }).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        userName: checkUser.userName,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login",
    });
  }
};

// Logout
const logoutUser = (req, res) => {
  res.clearCookie("token").json({
    success: true,
    message: "Logged out successfully!",
  });
};

// Resend OTP
const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already verified" 
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await User.updateOne(
      { email },
      { $set: { otp: { code: otp, expiresAt } } }
    );

    const emailSent = await sendOtpMail(email, otp, user.userName);
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send OTP email. Please try again." 
      });
    }

    res.status(200).json({
      success: true,
      message: "New OTP sent to your email",
    });
  } catch (e) {
    console.error("Resend OTP error:", e);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while resending OTP",
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await User.updateOne(
      { email },
      { $set: { resetPasswordOtp: { code: otp, expiresAt } } }
    );

    const emailSent = await sendOtpMail(email, otp, user.userName, "Password Reset OTP");
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send reset OTP email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reset OTP sent to your email",
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while processing forgot password request",
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (!/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least one capital letter, one number, and only letters/numbers",
      });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const otpNumber = parseInt(otp, 10);

    if (!user.resetPasswordOtp || !user.resetPasswordOtp.code || !user.resetPasswordOtp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Reset OTP not found or expired. Please request a new one.",
      });
    }

    if (user.resetPasswordOtp.code != otpNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset OTP. Please try again.",
      });
    }

    if (user.resetPasswordOtp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Reset OTP has expired. Please request a new one.",
      });
    }

    const hashPassword = await bcrypt.hash(newPassword, 12);
    await User.updateOne(
      { email },
      { $set: { password: hashPassword }, $unset: { resetPasswordOtp: 1 } }
    );

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (e) {
    console.error("Reset password error:", e);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while resetting password",
    });
  }
};

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized user!",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CLIENT_SECRET_KEY");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorized user!",
    });
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
  resetPassword 
};