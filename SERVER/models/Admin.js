import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  resetToken: String,  // 🔹 Store the token
  resetTokenExpires: Date,  // 🔹 Store expiration time
});

export default mongoose.model("Admin", adminSchema);