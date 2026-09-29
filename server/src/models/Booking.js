import mongoose from 'mongoose';

const bookedSeatDetailSchema = new mongoose.Schema(
  {
    seatId: { type: String, required: true, uppercase: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    seats: {
      type: [bookedSeatDetailSchema],
      required: true,
      validate: [
        (val) => val.length >= 1 && val.length <= 6,
        'A booking must contain between 1 and 6 seats',
      ],
    },
    seatIds: {
      type: [String],
      required: true,
    },
    subTotal: {
      type: Number,
      required: true,
    },
    convenienceFee: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CARD', 'UPI', 'WALLET', 'NETBANKING', 'RAZORPAY'],
      default: 'RAZORPAY',
    },
    orderId: {
      type: String,
      default: '',
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: '',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundPercentage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Partial unique index on confirmed seats per show:
// Guarantees no seatId in seatIds can be booked twice for the same show while status === 'CONFIRMED'.
// Once cancelled or failed, the seat is freed for new bookings.
bookingSchema.index(
  { show: 1, seatIds: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'CONFIRMED' },
  }
);

export const Booking = mongoose.model('Booking', bookingSchema);
