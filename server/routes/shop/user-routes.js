const express = require("express");
const {
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
} = require("../../controllers/auth/auth-controller");

const router = express.Router();

// Authentication routes
router.post("/register", registerUser);
router.post("/verify", verifyOtp);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/check-auth", authMiddleware, checkAuth);

// Admin routes
router.get("/users", authMiddleware, getAllUsers);
router.put("/users/:userId", authMiddleware, updateUser);
router.delete("/users/:userId", authMiddleware, deleteUser);

// User profile routes
router.put("/profile", authMiddleware, updateUserProfile);
router.post("/profile/request-email-otp", authMiddleware, requestProfileUpdateOtp);
router.post("/profile/verify-email", authMiddleware, verifyEmailUpdateOtp);
router.post("/profile/resend-email-otp", authMiddleware, resendEmailUpdateOtp);
router.post("/profile/cancel-email-verification", authMiddleware, cancelEmailVerification);

module.exports = router;