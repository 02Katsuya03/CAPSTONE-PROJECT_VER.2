import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  birthdate: Date,
  age: Number,
  password: String,
  resetToken: String,  // 🔹 Store the token
  resetTokenExpires: Date,  // 🔹 Store expiration time
});

export default mongoose.model("User", UserSchema);