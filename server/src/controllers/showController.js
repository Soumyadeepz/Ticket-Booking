import { Show } from '../models/Show.js';
import { SeatHold } from '../models/SeatHold.js';
import { Booking } from '../models/Booking.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const buildSeatLayout = (show, confirmedSet, heldByOthersSet, heldByMeMap) => {
  const layout = [];
  const seatsPerRow = show.seatsPerRow || 12;

  for (const tier of show.categories) {
    for (const row of tier.rows) {
      const rowSeats = [];
      for (let col = 1; col <= seatsPerRow; col++) {
        const seatId = `${row}${col}`;
        let status = 'AVAILABLE';
        let holdExpiresAt = null;

        if (confirmedSet.has(seatId)) {
          status = 'BOOKED';
        } else if (heldByMeMap.has(seatId)) {
          status = 'HELD_BY_ME';
          holdExpiresAt = heldByMeMap.get(seatId);
        } else if (heldByOthersSet.has(seatId)) {
          status = 'HELD';
        }

        rowSeats.push({
          seatId,
          row,
          col,
          category: tier.name,
          price: tier.price,
          color: tier.color,
          status,
          holdExpiresAt,
        });
      }
      layout.push({
        row,
        category: tier.name,
        price: tier.price,
        color: tier.color,
        seats: rowSeats,
      });
    }
  }
  return layout;
};

export const isValidSeatIdForShow = (show, seatId) => {
  const match = /^([A-Z]+)(\d+)$/.exec(seatId);
  if (!match) return null;
  const [, row, colStr] = match;
  const col = Number(colStr);
  if (col < 1 || col > (show.seatsPerRow || 12)) return null;

  const tier = show.categories.find((c) => c.rows.includes(row));
  if (!tier) return null;
  return { seatId, row, col, category: tier.name, price: tier.price };
};

// GET /api/shows/:id
export const getShowDetails = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id).populate('event');
  if (!show) {
    throw new AppError('Show not found.', 404);
  }

  const now = new Date();
  // Clean up any stale holds
  await SeatHold.deleteMany({ show: show._id, expiresAt: { $lte: now } });

  const [activeHolds, confirmedBookings] = await Promise.all([
    SeatHold.find({ show: show._id, expiresAt: { $gt: now } }),
    Booking.find({ show: show._id, status: 'CONFIRMED' }).select('seatIds'),
  ]);

  const confirmedSet = new Set(show.bookedSeats || []);
  for (const b of confirmedBookings) {
    for (const s of b.seatIds) confirmedSet.add(s);
  }

  const currentUserId = req.user?._id?.toString();
  const heldByOthersSet = new Set();
  const heldByMeMap = new Map();

  for (const hold of activeHolds) {
    if (confirmedSet.has(hold.seatId)) continue;
    if (currentUserId && hold.user.toString() === currentUserId) {
      heldByMeMap.set(hold.seatId, hold.expiresAt);
    } else {
      heldByOthersSet.add(hold.seatId);
    }
  }

  const seatLayout = buildSeatLayout(show, confirmedSet, heldByOthersSet, heldByMeMap);

  // Determine earliest hold expiry for current user so client 5-min timer syncs accurately
  let myHoldExpiresAt = null;
  for (const exp of heldByMeMap.values()) {
    if (!myHoldExpiresAt || exp < myHoldExpiresAt) {
      myHoldExpiresAt = exp;
    }
  }

  res.status(200).json({
    success: true,
    show,
    seatLayout,
    bookedSeats: Array.from(confirmedSet),
    heldSeats: Array.from(heldByOthersSet),
    myHeldSeats: Array.from(heldByMeMap.keys()),
    myHoldExpiresAt,
  });
});

// POST /api/shows/:id/hold
export const holdSeats = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) {
    throw new AppError('Show not found.', 404);
  }

  const { seatIds } = req.body;
  const uniqueSeatIds = [...new Set(seatIds)];

  if (uniqueSeatIds.length > 6) {
    throw new AppError('You can hold a maximum of 6 seats at a time.', 400);
  }

  // Validate seats exist in show layout
  const seatDetails = [];
  for (const seatId of uniqueSeatIds) {
    const info = isValidSeatIdForShow(show, seatId);
    if (!info) {
      throw new AppError(`Invalid seat ID: ${seatId}`, 400);
    }
    seatDetails.push(info);
  }

  const now = new Date();
  // Purge expired holds first
  await SeatHold.deleteMany({ show: show._id, expiresAt: { $lte: now } });

  // Check if any seat is already booked in Booking or Show
  const existingBooking = await Booking.findOne({
    show: show._id,
    status: 'CONFIRMED',
    seatIds: { $in: uniqueSeatIds },
  });

  const bookedInShow = uniqueSeatIds.some((s) => (show.bookedSeats || []).includes(s));

  if (existingBooking || bookedInShow) {
    throw new AppError('One or more selected seats have already been booked.', 409);
  }

  // Check if any seat is currently held by another user
  const conflictingHold = await SeatHold.findOne({
    show: show._id,
    seatId: { $in: uniqueSeatIds },
    user: { $ne: req.user._id },
    expiresAt: { $gt: now },
  });

  if (conflictingHold) {
    throw new AppError(
      `Seat ${conflictingHold.seatId} is currently held by another user. Please choose another seat.`,
      409
    );
  }

  // Release any previous holds by THIS user on this show before creating the fresh 5-min hold
  await SeatHold.deleteMany({ show: show._id, user: req.user._id });

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL
  try {
    const docs = uniqueSeatIds.map((seatId) => ({
      show: show._id,
      seatId,
      user: req.user._id,
      expiresAt,
    }));
    await SeatHold.insertMany(docs, { ordered: true });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Seat conflict: one or more seats were just held by another user.', 409);
    }
    throw err;
  }

  res.status(200).json({
    success: true,
    message: `${uniqueSeatIds.length} seat(s) held for 5 minutes.`,
    heldSeats: seatDetails,
    seatIds: uniqueSeatIds,
    expiresAt,
    ttlSeconds: 300,
  });
});
