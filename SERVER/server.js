import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import moment from "moment-timezone";

// Models
import User from "./models/User.js";
import Admin from "./models/Admin.js";

// Load environment variables from .env
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // User and Admin frontends
  credentials: true, // Allow cookies/credentials
}));

// Function to get the current time in "Asia/Manila" timezone
function getCurrentTime() {
  return moment().tz("Asia/Manila").format("MMMM D, YYYY hh:mm A");
}

// Request logging middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  let originMsg = "🌍 Unknown origin";

  // Determine origin based on request
  if (origin === "http://localhost:5173") {
    originMsg = "👤 User connected";
  } else if (origin === "http://localhost:5174") {
    originMsg = "🛠️ Admin connected";
  }

  console.log(getCurrentTime(), originMsg, "| Route:", req.method, req.originalUrl);
  next();
});
// Function to calculate age based on birthdate
function calculateAge(birthdate) {
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth();
  if (month < birthDate.getMonth() || (month === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// User Registration Route
app.post("/user/register", async (req, res) => {
  try {
    const { firstName, lastName, username, email, birthdate, password, confirmPassword } = req.body;

    // Validate if the passwords match
    if (password !== confirmPassword) return res.status(400).json({ message: "⚠️ Passwords do not match." });

    // Check if the email or username already exists
    if (await User.findOne({ email })) return res.status(400).json({ message: "⚠️ Email already in use." });
    if (await User.findOne({ username })) return res.status(400).json({ message: "⚠️ Username already taken." });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate the age based on the birthdate
    const age = calculateAge(birthdate);

    // Create a new user instance
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      birthdate,
      password: hashedPassword, // Store hashed password
      age, // Save the calculated age
    });

    // Save the new user to the database
    await newUser.save();

    res.status(201).json({ success: true, message: "✅ Registration successful!" });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ success: false, message: "🚨 Internal server error. Please try again later." });
  }
});

// User Login Route with JWT and Age Category
app.post("/user/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") });

    if (!user) {
      console.error("❌ Login Error: User not found:", username); // Log the error for debugging
      return res.status(400).json({ success: false, message: "User not found!" });
    }

    // Compare entered password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("❌ Login Error: Incorrect password for user:", username); // Log the error for debugging
      return res.status(400).json({ success: false, message: "Incorrect password!" });
    }

    // Determine Age Category
    let ageCategory = "";
    if (user.age >= 10 && user.age <= 14) ageCategory = "10-14";
    else if (user.age >= 15 && user.age <= 18) ageCategory = "15-18";
    else if (user.age >= 19 && user.age <= 22) ageCategory = "19-22";
    else if (user.age >= 23) ageCategory = "23-above";

    // Generate JWT Token
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log(getCurrentTime(), "✅ User logged in:", username);
    res.json({ success: true, message: "Login Successful!", ageCategory, token });
  } catch (error) {
    console.error(getCurrentTime(), "❌ Login Error:", error); // Log the error details for debugging
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin Registration
app.post("/admin/register", async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword)
      return res.status(400).json({ message: "⚠️ Passwords do not match. Please try again." });

    if (await Admin.findOne({ email }))
      return res.status(400).json({ message: "⚠️ This email is already in use." });

    if (await Admin.findOne({ username }))
      return res.status(400).json({ message: "⚠️ This username is already taken." });

    const hashed = await bcrypt.hash(password, 10);
    await new Admin({ firstName, lastName, username, email, password: hashed }).save();

    res.status(201).json({ success: true, message: "✅ Admin account created successfully." });
  } catch (err) {
    console.error("❌ Registration Error (Admin):", err);
    res.status(500).json({ success: false, message: "🚨 An internal server error occurred. Please try again later." });
  }
});

// Admin Login
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin || !(await bcrypt.compare(password, admin.password)))
      return res.status(400).json({ success: false, message: "🚫 Invalid username or password." });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, token, message: "🔓 Login successful. Welcome, admin!" });
  } catch (err) {
    console.error("❌ Login Error (Admin):", err);
    res.status(500).json({ success: false, message: "🚨 An internal server error occurred. Please try again later." });
  }
});

app.post("/password/forgot-password", async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: "⚠️ Email and type are required." });
    }

    const Model = type === "admin" ? Admin : User;

    const account = await Model.findOne({ email });
    if (!account) return res.status(404).json({ message: `⚠️ No ${type} account found with that email.` });

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });
    account.resetToken = resetToken;
    account.resetTokenExpires = Date.now() + 15 * 60 * 1000;
    await account.save();

    const link = `http://localhost:5173/reset-password?token=${resetToken}&type=${type}`;

    await nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    }).sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `${type?.toUpperCase() || "User"} Password Reset`,
      text: `To reset your password, please click the following link:\n\n${link}`,
    });

    res.json({ success: true, message: "📩 A password reset link has been sent to your email." });
  } catch (err) {
    console.error("❌ Password Reset Error:", err);
    res.status(500).json({ success: false, message: "🚨 Unable to send reset email. Please try again later." });
  }
});
app.post("/password/reset-password", async (req, res) => {
  try {
    const { token, newPassword, type } = req.body;

    if (!token || !newPassword || !type) {
      return res.status(400).json({ message: "⚠️ Token, new password, and type are required." });
    }

    const Model = type === "admin" ? Admin : User;

    const account = await Model.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!account) {
      return res.status(400).json({ message: "❌ This reset link is invalid or has expired." });
    }

    account.password = await bcrypt.hash(newPassword, 10);
    account.resetToken = null;
    account.resetTokenExpires = null;
    await account.save();

    res.json({ success: true, message: "🔁 Your password has been successfully updated." });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    res.status(500).json({ success: false, message: "🚨 Server error. Please try again later." });
  }
});

// Logout Route
app.post("/logout", (req, res) => {
  try {
    // Optional: You can log the logout time or handle token blacklisting here if needed
    const logoutTime = getCurrentTime();
    console.log(`${logoutTime} 🔒 User/Admin logged out`);

    // Since JWT is stateless, we just send a success response
    res.json({ success: true, message: "👋 Successfully logged out." });
  } catch (err) {
    console.error("❌ Logout Error:", err);
    res.status(500).json({ success: false, message: "🚨 Server error during logout." });
  }
});

// MongoDB connection and server setup
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yourdb"; // Fallback to local DB if no MONGO_URI is provided

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(getCurrentTime(), "✅ Successfully connected to MongoDB.");
    app.listen(PORT, () => {
      console.log(getCurrentTime(), `🚀 Server is now running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(getCurrentTime(), "❌ Failed to connect to MongoDB:", err);
    process.exit(1); // Force stop if DB connection fails
  });
