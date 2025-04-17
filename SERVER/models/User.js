import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
  },
  birthdate: {
    type: Date,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  faceImagePath: {
    type: String, // Path to the saved image
    required: true,
  },
  faceImageBase64: {
    type: String, // Optional: If you want to store the base64 string of the image
  },
  resetToken: {
    type: String, // Token used for password reset
  },
  resetTokenExpires: {
    type: Date, // Expiration date for the reset token
  },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
