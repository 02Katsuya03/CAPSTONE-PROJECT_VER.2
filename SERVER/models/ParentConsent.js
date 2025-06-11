import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const ParentConsentSchema = new Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String },
  expiresAt: { type: Date },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ParentConsent = model('ParentConsent', ParentConsentSchema);
export default ParentConsent;
