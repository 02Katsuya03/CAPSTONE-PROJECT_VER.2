import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  region: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  barangay: { type: String},  // Default value
}, { timestamps: true });

export default mongoose.model('Location', locationSchema);
