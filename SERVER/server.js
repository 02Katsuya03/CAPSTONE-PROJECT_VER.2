import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import moment from "moment-timezone";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Models
import User from "./models/User.js";
import Admin from "./models/Admin.js";
import chatRoutes from './routes/chat.js';


// Load environment variables from .env
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // User and Admin frontends
  credentials: true, // Allow cookies/credentials
}));

app.use(cors());

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
app.use(express.json({ limit: '10mb' }));  // handle base64 images


app.use('/api/chat', chatRoutes);
// Define storage location and file naming convention
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create a directory path based on the username
    const userDir = path.join("uploads", req.body.username);

    // Ensure the directory exists
    fs.mkdirSync(userDir, { recursive: true });

    // Specify the destination directory
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Set the file name to be unique with the current timestamp
    cb(null, `face-${Date.now()}.jpg`);
  }
});

// Filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("⚠️ Only image files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

// User registration route
app.post("/user/register", upload.single('faceImage'), async (req, res) => {
  try {
    // Extract user details from the request body
    const { firstName, lastName, username, email, birthdate, password, confirmPassword } = req.body;

    // Check if the face image is provided
    if (!req.file) {
      return res.status(400).json({ message: "⚠️ No face image provided. Please complete the face capture before registering." });
    }

    // Check password confirmation
    if (password !== confirmPassword) return res.status(400).json({ message: "⚠️ Passwords do not match." });

    // Check if the email or username already exists in the database
    if (await User.findOne({ email })) return res.status(400).json({ message: "⚠️ Email already in use." });
    if (await User.findOne({ username })) return res.status(400).json({ message: "⚠️ Username already taken." });

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate the user's age from their birthdate
    const age = calculateAge(birthdate);

    // Get the saved image path from the uploaded file
    const imagePath = req.file.path;

    // Create a new user object and save it to the database
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      birthdate,
      password: hashedPassword,
      age,
      faceImagePath: imagePath  // Save the path to the uploaded image
    });

    // Save the user to the database
    await newUser.save();

    // Send a success response
    res.status(201).json({ success: true, message: "✅ Registration successful!" });
  } catch (err) {
    // Log and return an error response
    console.error("❌ Registration Error:", err);
    res.status(500).json({ success: false, message: "🚨 Internal server error. Please try again later." });
  }
});

app.post("/user/verify-password", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") });

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error during password verification:", err);
    res.status(500).json({ success: false, message: "Server error during password verification." });
  }
});


app.post("/user/face-login", async (req, res) => {
  const { username, faceImage } = req.body;

  try {
    const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") });
    if (!user) return res.status(400).json({ success: false, message: "User not found." });

    // Load reference image from stored base64 or file path
    const referenceBase64 = user.faceImageBase64;
    if (!referenceBase64) return res.status(400).json({ success: false, message: "No face data for user." });

    // Use your face-api.js or CompreFace logic to compare faceImage vs referenceBase64
    const isMatch = await compareFaces(faceImage, referenceBase64);

    if (!isMatch) return res.status(400).json({ success: false, message: "Face does not match." });

    // Determine age group
    const age = user.age;
    let ageCategory = "";
    if (age >= 10 && age <= 14) ageCategory = "10-14";
    else if (age >= 15 && age <= 18) ageCategory = "15-18";
    else if (age >= 19 && age <= 22) ageCategory = "19-22";
    else ageCategory = "23-above";

    // Mock JWT or token generation
    const token = `fake-jwt-token-for-${username}`;

    res.json({
      success: true,
      message: "Face verified successfully.",
      username,
      ageCategory,
      token,
    });

  } catch (err) {
    console.error("Face login error:", err);
    res.status(500).json({ success: false, message: "Server error during face login." });
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

    app.listen(PORT, "0.0.0.0", () => {
      console.log(getCurrentTime(), `🚀 Server is now running and accessible at:`);
      console.log(`   🌐 Local:     http://localhost:${PORT}`);
      console.log(`   🌐 Network:   http://0.0.0.0:${PORT}`);
    });

  })
  .catch((err) => {
    console.error(getCurrentTime(), "❌ Failed to connect to MongoDB:", err);
    process.exit(1); // Force stop if DB connection fails
  });
