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
        success: false,
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

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { userName: userName }
      ]
    });

    if (existingUser) {
      // Check if they've already registered but not verified
      if (existingUser.email === email && !existingUser.isVerified) {
        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit code
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min from now
        
        existingUser.otp = { code: otp, expiresAt };
        // Keep the same password if re-registering
        await existingUser.save();
        
        // Try to send OTP email
        const emailSent = await sendOtpMail(email, otp, userName);
        
        return res.status(200).json({
          success: true,
          message: "Account already exists. New OTP sent for verification.",
          emailSent: emailSent,
        });
      }
      
      // Otherwise, it's a duplicate account
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: "Email already in use. Please use a different email address.",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Username already taken. Please choose a different username.",
        });
      }
    }

    // Create new user
    const hashPassword = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit code
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min from now

    const newUser = new User({
      userName,
      email,
      password: hashPassword,
      otp: { code: otp, expiresAt },
    });

    await newUser.save();
    
    // Send OTP email with proper error handling
    const emailSent = await sendOtpMail(email, otp, userName);
    
    if (!emailSent) {
      console.log(`Failed to send OTP email to ${email}`);
      // We still create the user but inform about email sending issue
      return res.status(201).json({
        success: true,
        message: "Account created but couldn't send verification email. Try resending OTP.",
        emailSent: false
      });
    }

    console.log(`User registered with ID ${newUser._id} and OTP sent to ${email}`);
    res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify.",
      emailSent: true
    });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred during registration",
    });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and OTP are required" 
      });
    }

    const user = await User.findOne({ email });
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

    // Convert string OTP to number for comparison if needed
    const otpNumber = parseInt(otp, 10);
    
    // Check if OTP is valid and not expired
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP not found or expired. Please request a new one." 
      });
    }
    
    // Check OTP validity
    if (user.otp.code != otpNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid OTP. Please try again." 
      });
    }
    
    // Check OTP expiration
    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP has expired. Please request a new one." 
      });
    }

    // Mark user as verified and remove OTP
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Email verified successfully!" 
    });
  } catch (e) {
    console.error("OTP verification error:", e);
    res.status(500).json({ 
      success: false, 
      message: "Server error during verification" 
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

    const checkUser = await User.findOne({ email });
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

    // Set secure to true in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000 // 60 minutes
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
      message: "Server error during login",
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

// Resend OTP endpoint
const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const user = await User.findOne({ email });
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

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit code
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min from now

    user.otp = { code: otp, expiresAt };
    await user.save();

    // Send the new OTP
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
      message: "Server error while resending OTP",
    });
  }
};

// Auth middleware - Fix to handle CORS preflight issues
const authMiddleware = async (req, res, next) => {
  // Handle preflight requests
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

module.exports = { registerUser, loginUser, logoutUser, authMiddleware, verifyOtp, resendOtp };