import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  username: String,
  fullName: String,
  message: String,
  sender: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("ChatSession", chatSessionSchema);
