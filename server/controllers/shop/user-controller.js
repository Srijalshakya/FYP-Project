const bcrypt = require("bcrypt");
const User = require("../models/User");

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, currentPassword, newPassword } = req.body;

    // Validate user ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Validate current password
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update username if provided
    if (userName) {
      user.userName = userName;
    }

    // Update password if provided
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (e) {
    console.error("Update user error:", e);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: e.message,
    });
  }
};

module.exports = { updateUser };