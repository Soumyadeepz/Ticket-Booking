import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Show } from '../models/Show.js';
import { SeatHold } from '../models/SeatHold.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { isValidSeatIdForShow } from './showController.js';
import { getRazorpayInstance } from './paymentController.js';
import {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
} from '../utils/mailer.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const generateBookingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TB-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

async function runTransactional(workFn) {
  let session = null;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await workFn(session);
    });
    session.endSession();
    return result;
  } catch (err) {
    if (session) session.endSession();
    if (
      err.code === 20 ||
      err.message?.includes('Transaction numbers are only allowed on a replica set')
    ) {
      return workFn(null);
    }
    throw err;
  }
}

// POST /api/bookings
export const createBooking = asyncHandler(async (req, res) => {
  const { showId, seatIds, paymentMethod, initiatePayment } = req.body;
  const uniqueSeatIds = [...new Set(seatIds)];

  if (uniqueSeatIds.length < 1 || uniqueSeatIds.length > 6) {
    throw new AppError('You can book between 1 and 6 seats per transaction.', 400);
  }

  const booking = await runTransactional(async (session) => {
    const opts = session ? { session } : {};

    const show = await Show.findById(showId, null, opts).populate('event');
    if (!show) {
      throw new AppError('Show not found.', 404);
    }

    const seatDetails = [];
    let subTotal = 0;
    for (const seatId of uniqueSeatIds) {
      const info = isValidSeatIdForShow(show, seatId);
      if (!info) {
        throw new AppError(`Invalid seat selection: ${seatId}`, 400);
      }
      seatDetails.push({
        seatId: info.seatId,
        category: info.category,
        price: info.price,
      });
      subTotal += info.price;
    }

    const now = new Date();

    // Check if any seat is actively held by ANOTHER user
    const heldByOther = await SeatHold.findOne(
      {
        show: show._id,
        seatId: { $in: uniqueSeatIds },
        user: { $ne: req.user._id },
        expiresAt: { $gt: now },
      },
      null,
      opts
    );

    if (heldByOther) {
      throw new AppError(
        `Seat ${heldByOther.seatId} is currently held by another customer.`,
        409
      );
    }

    // Check if any seat is already confirmed in Booking or Show
    const alreadyConfirmed = await Booking.findOne(
      {
        show: show._id,
        status: 'CONFIRMED',
        seatIds: { $in: uniqueSeatIds },
      },
      null,
      opts
    );

    const alreadyBookedInShow = uniqueSeatIds.some((s) =>
      (show.bookedSeats || []).includes(s)
    );

    if (alreadyConfirmed || alreadyBookedInShow) {
      throw new AppError('One or more selected seats are already booked.', 409);
    }

    const convenienceFee = Math.round(subTotal * 0.08);
    const totalAmount = subTotal + convenienceFee;

    // If initiatePayment === true (Razorpay Checkout flow):
    // Create booking in PENDING state and keep SeatHold active until POST /api/payments/verify!
    if (initiatePayment) {
      // Refresh user's 5-min SeatHold while they complete Razorpay Checkout
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await SeatHold.deleteMany({ show: show._id, user: req.user._id }, opts);
      await SeatHold.insertMany(
        uniqueSeatIds.map((seatId) => ({
          show: show._id,
          seatId,
          user: req.user._id,
          expiresAt,
        })),
        opts
      );

      const [pendingBooking] = await Booking.create(
        [
          {
            bookingCode: generateBookingCode(),
            user: req.user._id,
            show: show._id,
            event: show.event._id || show.event,
            seats: seatDetails,
            seatIds: uniqueSeatIds,
            subTotal,
            convenienceFee,
            totalAmount,
            paymentMethod: paymentMethod || 'RAZORPAY',
            paymentStatus: 'PENDING',
            status: 'PENDING',
          },
        ],
        opts
      );

      return pendingBooking;
    }

    // Direct confirmation flow (when initiatePayment is false)
    const updatedShow = await Show.findOneAndUpdate(
      {
        _id: show._id,
        bookedSeats: { $nin: uniqueSeatIds },
      },
      {
        $addToSet: { bookedSeats: { $each: uniqueSeatIds } },
      },
      { new: true, ...opts }
    );

    if (!updatedShow) {
      throw new AppError('One or more selected seats were just booked by another user.', 409);
    }

    const [createdBooking] = await Booking.create(
      [
        {
          bookingCode: generateBookingCode(),
          user: req.user._id,
          show: show._id,
          event: show.event._id || show.event,
          seats: seatDetails,
          seatIds: uniqueSeatIds,
          subTotal,
          convenienceFee,
          totalAmount,
          paymentMethod,
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      ],
      opts
    );

    await SeatHold.deleteMany(
      {
        show: show._id,
        seatId: { $in: uniqueSeatIds },
      },
      opts
    );

    return createdBooking;
  });

  const populatedBooking = await Booking.findById(booking._id)
    .populate('event')
    .populate('show');

  if (populatedBooking.status === 'CONFIRMED') {
    await sendBookingConfirmationEmail({
      booking: populatedBooking,
      user: req.user,
    });
  }

  res.status(201).json({
    success: true,
    message:
      populatedBooking.status === 'PENDING'
        ? 'Booking initialized. Proceed to Razorpay payment.'
        : 'Tickets booked successfully!',
    booking: populatedBooking,
  });
});

// GET /api/bookings/my
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    user: req.user._id,
    status: { $in: ['CONFIRMED', 'CANCELLED', 'FAILED'] },
  })
    .populate('event')
    .populate('show')
    .sort({ createdAt: -1 });

  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  const enriched = bookings.map((b) => {
    const obj = b.toObject();
    const showStart = obj.show?.startTime ? new Date(obj.show.startTime).getTime() : 0;
    const msUntilShow = showStart - now;
    const canCancel = obj.status === 'CONFIRMED' && msUntilShow >= twoHoursMs;

    const hoursUntilShow = msUntilShow / (1000 * 60 * 60);
    const estimatedRefundPct = hoursUntilShow >= 24 ? 90 : hoursUntilShow >= 2 ? 75 : 0;
    const estimatedRefundAmount = Math.round((obj.totalAmount * estimatedRefundPct) / 100);

    return {
      ...obj,
      canCancel,
      hoursUntilShow: Math.max(0, Number(hoursUntilShow.toFixed(1))),
      estimatedRefundPct,
      estimatedRefundAmount,
    };
  });

  res.status(200).json({
    success: true,
    count: enriched.length,
    bookings: enriched,
  });
});

// GET /api/bookings/:id
export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let booking = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    booking = await Booking.findOne({ _id: id, user: req.user._id })
      .populate('event')
      .populate('show');
  }
  if (!booking) {
    booking = await Booking.findOne({
      bookingCode: id.toUpperCase(),
      user: req.user._id,
    })
      .populate('event')
      .populate('show');
  }

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  res.status(200).json({
    success: true,
    booking,
  });
});

// PATCH /api/bookings/:id/cancel
export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const updated = await runTransactional(async (session) => {
    const opts = session ? { session } : {};

    const booking = await Booking.findOne({ _id: id, user: req.user._id }, null, opts).populate(
      'show'
    );

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError('This booking has already been cancelled.', 400);
    }

    const showStartMs = new Date(booking.show.startTime).getTime();
    const nowMs = Date.now();
    const diffMs = showStartMs - nowMs;
    const twoHoursMs = 2 * 60 * 60 * 1000;

    if (diffMs < twoHoursMs) {
      throw new AppError(
        'Cancellations are only permitted up to 2 hours before the scheduled showtime.',
        400
      );
    }

    const hoursBeforeShow = diffMs / (1000 * 60 * 60);
    const refundPercentage = hoursBeforeShow >= 24 ? 90 : 75;
    const refundAmount = Math.round((booking.totalAmount * refundPercentage) / 100);

    // If paymentStatus is PAID, trigger Razorpay Refund API and set paymentStatus = 'REFUNDED'
    if (booking.paymentStatus === 'PAID') {
      if (booking.paymentId && !booking.paymentId.startsWith('pay_test_')) {
        try {
          const rzp = getRazorpayInstance();
          await rzp.payments.refund(booking.paymentId, {
            amount: Math.round(refundAmount * 100),
            notes: {
              bookingCode: booking.bookingCode,
              reason: reason || 'Customer cancellation',
            },
          });
        } catch (err) {
          console.warn(`ℹ️ Razorpay refund API note (test mode): ${err.message}`);
        }
      }
      booking.paymentStatus = 'REFUNDED';
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelReason = reason || 'Cancelled by user';
    booking.refundPercentage = refundPercentage;
    booking.refundAmount = refundAmount;
    await booking.save(opts);

    // Free seats in Show.bookedSeats
    await Show.updateOne(
      { _id: booking.show._id },
      { $pullAll: { bookedSeats: booking.seatIds } },
      opts
    );

    return booking;
  });

  const populated = await Booking.findById(updated._id).populate('event').populate('show');
  const user = await User.findById(req.user._id);

  // Send cancellation & refund email notification
  await sendCancellationEmail({ booking: populated, user });

  res.status(200).json({
    success: true,
    message: `Booking cancelled. Refund of ₹${populated.refundAmount} (${populated.refundPercentage}%) initiated via Razorpay.`,
    booking: populated,
  });
});

// GET /api/bookings/:id/ticket — Generates Downloadable PDF Ticket with QR Code (Owner Only)
export const downloadTicketPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let booking = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    booking = await Booking.findById(id).populate('event').populate('show');
  } else {
    booking = await Booking.findOne({ bookingCode: id.toUpperCase() })
      .populate('event')
      .populate('show');
  }

  if (!booking) {
    throw new AppError('Booking not found.', 404);
  }

  // Strictly enforce owner-only access
  if (booking.user.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden: Only the booking owner can download this ticket.', 403);
  }

  // Generate QR Code PNG Buffer encoding the bookingCode for venue check-in
  const qrBuffer = await QRCode.toBuffer(booking.bookingCode, {
    type: 'png',
    width: 180,
    margin: 1,
    color: {
      dark: '#09090b',
      light: '#ffffff',
    },
  });

  // Optionally fetch poster image buffer if available
  let posterBuffer = null;
  if (booking.event?.posterUrl && booking.event.posterUrl.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const imgRes = await fetch(booking.event.posterUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (imgRes.ok) {
        const arrBuf = await imgRes.arrayBuffer();
        posterBuffer = Buffer.from(arrBuf);
      }
    } catch {
      // Poster fallback handled gracefully below
    }
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="TicketBook-${booking.bookingCode}.pdf"`
  );

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `TicketBook E-Ticket - ${booking.bookingCode}`,
      Author: 'TicketBook Cinema & Live Entertainment',
    },
  });

  doc.pipe(res);

  // Dark Header Banner
  doc.roundedRect(40, 40, 515, 75, 14).fill('#0c0c14');
  doc
    .fillColor('#a855f7')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('TICKETBOOK OFFICIAL E-TICKET', 62, 60);
  doc
    .fillColor('#ffffff')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(booking.event?.title || 'Cinema Show', 62, 78, { width: 360, lineBreak: false });
  doc
    .fillColor('#f43f5e')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(booking.bookingCode, 430, 74, { align: 'right', width: 105 });

  // Main Ticket Card Body
  doc.roundedRect(40, 130, 515, 310, 14).fillAndStroke('#181824', '#2e2e42');

  // Poster Image or Styled Placeholder Box
  if (posterBuffer) {
    try {
      doc.image(posterBuffer, 60, 150, { width: 115, height: 165 });
    } catch {
      doc.roundedRect(60, 150, 115, 165, 8).fill('#27273a');
    }
  } else {
    doc.roundedRect(60, 150, 115, 165, 8).fill('#27273a');
    doc
      .fillColor('#a855f7')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(booking.event?.category || 'EVENT', 70, 225, { width: 95, align: 'center' });
  }

  const showDateStr = booking.show?.startTime
    ? new Date(booking.show.startTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Scheduled Showtime';

  // Details Column
  const leftX = 195;
  doc.fillColor('#a1a1aa').fontSize(9).font('Helvetica-Bold').text('EVENT & CATEGORY', leftX, 152);
  doc
    .fillColor('#ffffff')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(
      `${booking.event?.title || ''} (${booking.event?.category || 'Movie'} • ${
        booking.event?.language || 'English'
      })`,
      leftX,
      166,
      { width: 340 }
    );

  doc.fillColor('#a1a1aa').fontSize(9).font('Helvetica-Bold').text('VENUE & AUDITORIUM', leftX, 204);
  doc
    .fillColor('#ffffff')
    .fontSize(12)
    .font('Helvetica')
    .text(
      `${booking.show?.venue?.name || 'Venue'} — ${booking.show?.venue?.screenName || 'Screen 1'}`,
      leftX,
      218,
      { width: 340 }
    );
  doc
    .fillColor('#d4d4d8')
    .fontSize(10)
    .text(
      `${booking.show?.venue?.address || ''}, ${booking.show?.venue?.city || ''}`,
      leftX,
      235,
      { width: 340 }
    );

  doc.fillColor('#a1a1aa').fontSize(9).font('Helvetica-Bold').text('DATE & SHOWTIME', leftX, 262);
  doc.fillColor('#10b981').fontSize(12).font('Helvetica-Bold').text(showDateStr, leftX, 276);

  doc.fillColor('#a1a1aa').fontSize(9).font('Helvetica-Bold').text('CONFIRMED SEATS', 60, 336);
  doc
    .fillColor('#ffffff')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(
      (booking.seats || []).map((s) => `${s.seatId} (${s.category})`).join(', ') ||
        (booking.seatIds || []).join(', '),
      60,
      352,
      { width: 280 }
    );

  doc.fillColor('#a1a1aa').fontSize(9).font('Helvetica-Bold').text('TOTAL PAID', 60, 386);
  doc
    .fillColor('#f43f5e')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(
      `INR ${booking.totalAmount} (${booking.paymentStatus || 'PAID'} • ${booking.status})`,
      60,
      402
    );

  // QR Check-in Box on Right
  doc.roundedRect(390, 275, 145, 150, 10).fill('#ffffff');
  doc.image(qrBuffer, 405, 282, { width: 115, height: 115 });
  doc
    .fillColor('#09090b')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(`SCAN AT ENTRY: ${booking.bookingCode}`, 395, 404, {
      width: 135,
      align: 'center',
    });

  // Footer Instructions
  doc
    .fillColor('#71717a')
    .fontSize(9)
    .font('Helvetica')
    .text(
      'Present this PDF ticket or QR code at the venue entrance. Cancellations are allowed up to 2 hours before showtime.',
      40,
      460,
      { align: 'center', width: 515 }
    );

  doc.end();
});
