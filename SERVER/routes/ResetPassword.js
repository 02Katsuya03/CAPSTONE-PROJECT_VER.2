// routes/resetPasswordRoute.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js"; // Adjust the path to your User model
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// POST /password/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  try {
    if (!token) {
      console.warn("Reset Password Attempt: Missing token");
      return res.status(400).json({ message: "Invalid or missing token." });
    }

    if (newPassword !== confirmPassword) {
      console.warn("Reset Password Attempt: Passwords do not match");
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Find user by token ONLY (ignore expiration here to log more details)
    const user = await User.findOne({ resetToken: token });

    if (!user) {
      console.warn(`Reset Password Attempt: No user found with token: ${token}`);
      return res.status(400).json({ message: "Invalid or expired password reset token." });
    }

    // Check if token expired manually
    if (!user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
      console.warn(`Reset Password Attempt: Token expired. Token expiry: ${user.resetTokenExpires}, current time: ${Date.now()}`);
      return res.status(400).json({ message: "Invalid or expired password reset token." });
    }

    // Token is valid and not expired - update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear reset token fields
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.json({ message: "✅ Password has been successfully reset." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
