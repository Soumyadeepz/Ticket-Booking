import mongoose from 'mongoose';

const categoryTierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['VIP', 'Premium', 'Executive', 'Classic'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    rows: {
      type: [String],
      required: true,
    },
    color: {
      type: String,
      default: 'purple',
    },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    venue: {
      name: { type: String, required: true },
      city: { type: String, required: true, default: 'Mumbai' },
      address: { type: String, required: true },
      screenName: { type: String, required: true, default: 'IMAX Laser Screen 1' },
      audioFormat: { type: String, default: 'Dolby Atmos 4K' },
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    categories: {
      type: [categoryTierSchema],
      default: [
        { name: 'VIP', price: 580, rows: ['A', 'B'], color: 'rose' },
        { name: 'Premium', price: 420, rows: ['C', 'D', 'E'], color: 'purple' },
        { name: 'Executive', price: 310, rows: ['F', 'G', 'H'], color: 'indigo' },
        { name: 'Classic', price: 220, rows: ['I', 'J'], color: 'slate' },
      ],
    },
    seatsPerRow: {
      type: Number,
      default: 12,
    },
    bookedSeats: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const Show = mongoose.model('Show', showSchema);
