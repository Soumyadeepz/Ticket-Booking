import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['REGISTER', 'LOGIN'],
      required: true,
    },
    requestedRole: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      index: { expires: 0 }, // MongoDB TTL index: deletes document automatically at expiresAt
    },
  },
  { timestamps: true }
);

export const Otp = mongoose.model('Otp', otpSchema);
