import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Booking } from '../models/Booking.js';
import { Show } from '../models/Show.js';
import { SeatHold } from '../models/SeatHold.js';
import { User } from '../models/User.js';
import { sendBookingConfirmationEmail } from '../utils/mailer.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const getRazorpayCredentials = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || 'rzp_test_ticketbook_demo_key')
    .replace(/^["']|["']$/g, '')
    .trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || 'rzp_test_ticketbook_demo_secret')
    .replace(/^["']|["']$/g, '')
    .trim();
  const webhookSecret = (
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    'rzp_test_ticketbook_webhook_secret'
  )
    .replace(/^["']|["']$/g, '')
    .trim();

  return { keyId, keySecret, webhookSecret };
};

export const getRazorpayInstance = () => {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// POST /api/payments/create-order
export const createOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    throw new AppError('bookingId is required to create a Razorpay order.', 400);
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    user: req.user._id,
  })
    .populate('event')
    .populate('show');

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  if (booking.status !== 'PENDING') {
    throw new AppError(
      `Cannot create payment order for booking with status ${booking.status}.`,
      400
    );
  }

  const { keyId, keySecret } = getRazorpayCredentials();
  const amountInPaise = Math.round(booking.totalAmount * 100);

  let orderId = '';
  let isSimulatedTestOrder = false;

  try {
    // Attempt live Razorpay Order creation if real rzp_test_ / rzp_live_ key is configured
    if (keyId.startsWith('rzp_') && !keyId.includes('demo')) {
      const rzp = getRazorpayInstance();
      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: booking.bookingCode,
        notes: {
          bookingId: booking._id.toString(),
          bookingCode: booking.bookingCode,
        },
      });
      orderId = order.id;
    } else {
      isSimulatedTestOrder = true;
      orderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
    }
  } catch (err) {
    // Fallback to test order ID if Razorpay test credentials are not active on Razorpay's server
    isSimulatedTestOrder = true;
    orderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
  }

  booking.orderId = orderId;
  booking.paymentStatus = 'PENDING';
  await booking.save();

  // For local/test mode where Razorpay's hosted modal cannot sign with a placeholder key,
  // generate a deterministic test payment ID & server-signed HMAC so the test checkout modal
  // goes through the exact same server-side HMAC verification in POST /api/payments/verify.
  const testPaymentId = `pay_test_${crypto.randomBytes(8).toString('hex')}`;
  const testSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${testPaymentId}`)
    .digest('hex');

  res.status(200).json({
    success: true,
    orderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId,
    bookingId: booking._id,
    bookingCode: booking.bookingCode,
    isSimulatedTestOrder,
    ...(process.env.NODE_ENV !== 'production' || isSimulatedTestOrder
      ? { testPaymentId, testSignature }
      : {}),
  });
});

// Helper to finalize a confirmed booking or mark it failed
export const finalizeBookingPayment = async ({
  booking,
  paymentId,
  orderId,
  isSuccess,
}) => {
  if (!isSuccess) {
    booking.status = 'FAILED';
    booking.paymentStatus = 'FAILED';
    if (orderId) booking.orderId = orderId;
    if (paymentId) booking.paymentId = paymentId;
    await booking.save();

    // Release the held seats immediately so other users can book them
    await SeatHold.deleteMany({
      show: booking.show._id || booking.show,
      seatId: { $in: booking.seatIds },
    });
    return booking;
  }

  // If already confirmed (e.g. by webhook or verify), return idempotently
  if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
    return booking;
  }

  const showId = booking.show._id || booking.show;

  // Atomically lock seats on Show document
  const updatedShow = await Show.findOneAndUpdate(
    {
      _id: showId,
      bookedSeats: { $nin: booking.seatIds },
    },
    {
      $addToSet: { bookedSeats: { $each: booking.seatIds } },
    },
    { new: true }
  );

  if (!updatedShow) {
    booking.status = 'FAILED';
    booking.paymentStatus = 'FAILED';
    await booking.save();
    await SeatHold.deleteMany({
      show: showId,
      seatId: { $in: booking.seatIds },
    });
    throw new AppError(
      'Seats were booked by another user before payment completed. Booking marked FAILED.',
      409
    );
  }

  booking.status = 'CONFIRMED';
  booking.paymentStatus = 'PAID';
  if (paymentId) booking.paymentId = paymentId;
  if (orderId) booking.orderId = orderId;
  await booking.save();

  // Delete the seat holds now that the booking is CONFIRMED
  await SeatHold.deleteMany({
    show: showId,
    seatId: { $in: booking.seatIds },
  });

  // Populate event, show, and user to send the Booking Confirmation Email
  const populatedBooking = await Booking.findById(booking._id)
    .populate('event')
    .populate('show');
  const user = await User.findById(booking.user);

  await sendBookingConfirmationEmail({ booking: populatedBooking, user });

  return populatedBooking;
};

// POST /api/payments/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!bookingId) {
    throw new AppError('bookingId is required.', 400);
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    user: req.user._id,
  });

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  const { keySecret } = getRazorpayCredentials();

  const orderIdToVerify = razorpay_order_id || booking.orderId;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderIdToVerify}|${razorpay_payment_id || ''}`)
    .digest('hex');

  const isSignatureValid =
    Boolean(razorpay_order_id && razorpay_payment_id && razorpay_signature) &&
    expectedSignature === razorpay_signature;

  if (!isSignatureValid) {
    // Verification failed -> release seat holds and mark booking FAILED
    await finalizeBookingPayment({
      booking,
      paymentId: razorpay_payment_id || '',
      orderId: orderIdToVerify,
      isSuccess: false,
    });

    throw new AppError(
      'Razorpay payment signature verification failed. Seat holds released and booking marked FAILED.',
      400
    );
  }

  // Signature valid -> mark booking CONFIRMED, paymentStatus PAID, delete holds, send email
  const confirmedBooking = await finalizeBookingPayment({
    booking,
    paymentId: razorpay_payment_id,
    orderId: orderIdToVerify,
    isSuccess: true,
  });

  res.status(200).json({
    success: true,
    message: 'Payment verified and booking confirmed!',
    booking: confirmedBooking,
  });
});

// POST /api/payments/webhook
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const { webhookSecret } = getRazorpayCredentials();

  const payloadString = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadString)
    .digest('hex');

  if (!signature || signature !== expectedSignature) {
    throw new AppError('Invalid Razorpay webhook signature.', 400);
  }

  const eventType = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;
  const orderId = paymentEntity?.order_id || req.body?.payload?.order?.entity?.id;
  const paymentId = paymentEntity?.id || '';

  if (orderId) {
    const booking = await Booking.findOne({ orderId });
    if (booking && booking.status === 'PENDING') {
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        await finalizeBookingPayment({
          booking,
          paymentId,
          orderId,
          isSuccess: true,
        });
      } else if (eventType === 'payment.failed') {
        await finalizeBookingPayment({
          booking,
          paymentId,
          orderId,
          isSuccess: false,
        });
      }
    }
  }

  res.status(200).json({ status: 'ok' });
});
