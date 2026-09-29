import mongoose from 'mongoose';

const seatHoldSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
    },
    seatId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes TTL
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

// Unique compound index on { show, seatId } to prevent double-holding the same seat
seatHoldSchema.index({ show: 1, seatId: 1 }, { unique: true });

export const SeatHold = mongoose.model('SeatHold', seatHoldSchema);
