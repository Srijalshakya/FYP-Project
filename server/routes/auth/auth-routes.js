const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  authMiddleware,
  verifyOtp,
  resendOtp,
} = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify", verifyOtp); // Changed from verify-otp to match frontend
router.post("/login", loginUser);
router.post("/logout", logoutUser);
// 5. Add resend-otp route to router.js
router.post("/resend-otp", resendOtp);
router.get("/check-auth", authMiddleware, (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    user,
  });
});

module.exports = router;