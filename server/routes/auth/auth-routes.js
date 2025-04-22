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
} = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify", verifyOtp);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/check-auth", authMiddleware, (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    user,
  });
});

module.exports = router;