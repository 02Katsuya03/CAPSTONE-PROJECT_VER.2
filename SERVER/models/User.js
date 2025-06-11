// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Make sure you have bcryptjs installed for password hashing

const { Schema, model } = mongoose;

const UserSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true // Ensures every user has a unique ID, important for internal lookup
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Store emails in lowercase for consistent lookups
    trim: true,      // Remove leading/trailing whitespace
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] // Basic email format validation
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null values for non-unique constraint, useful for social/phone users
    required: function() {
      // Username is only required if the user signed up manually (traditional login)
      return this.createdFrom === 'manual';
    }
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows null values for non-unique constraint
    required: function() {
      // Phone number is only required if the user signed up via phone (OTP)
      return this.createdFrom === 'phone';
    }
  },
  password: {
    type: String,
    required: function() {
      // Password is only required if the user signed up manually
      return this.createdFrom === 'manual';
    }
  },
  sex: { type: String, enum: ['Male', 'Female', 'Other'] },
  region: { type: String },
  province: { type: String },
  city: { type: String },
  barangay: { type: String },
  birthdate: { type: Date, required: true },
  age: { type: Number, required: true },
  survey: {
    ageGroup: { type: String, required: true },
    infoSource: { type: String },
    learningSource: { type: String }
  },
  parentConsent: {
    relationship: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    otpVerified: { type: Boolean, default: false }
  },
  role: { type: String, default: 'user', enum: ['user', 'admin', 'healthcare'] },
  status: { type: String, default: 'active', enum: ['active', 'suspended'] },
  resetToken: { type: String },
  resetTokenExpires: { type: Date },
  googleId: String, // To store Google's unique ID for a user
  firebaseUid: String, // To store Firebase's unique UID for a user (can be for Google, Facebook, etc.)
  createdFrom: { type: String, enum: ['manual', 'google', 'phone'], default: 'manual' },
  createdAt: { type: Date, default: Date.now },
  // --- NEW FIELDS FOR LOGIN ATTEMPT LIMITER (NO ASTERISKS HERE) ---
  failedLoginAttempts: { // Corrected: Removed **
    type: Number,
    default: 0 // Initialize to 0 failed attempts
  },
  lockoutUntil: { // Corrected: Removed **
    type: Date,
    default: null // Null means the account is not currently locked out
  }
});

// --- Mongoose Middleware for Password Hashing ---
UserSchema.pre('save', async function(next) {
  // Only hash the password if the user was created manually AND the password field has been modified
  if (this.createdFrom === 'manual' && this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// --- Mongoose Method for Password Comparison ---
UserSchema.methods.comparePassword = async function(candidatePassword) {
  // Only attempt to compare password if the user was created manually and has a password
  if (this.createdFrom !== 'manual' || !this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = model('User', UserSchema);
export default User;