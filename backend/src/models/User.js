import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  skinType: {
    type: String,
    required: true,
    enum: ['dry', 'oily', 'combination', 'normal'] 
  },
  concerns: [String], 
  budget: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high']
  },
  routinePreference: {
    type: String,
    default: 'full',
    enum: ['minimalist', 'full']
  },
  location: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema);